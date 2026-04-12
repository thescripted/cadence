import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const shell = process.env.SHELL || "/bin/zsh";

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const streamConfigs = {
  backend: {
    color: colors.cyan,
    cwd: path.join(rootDir, "apps/api"),
    command: "go run ./cmd/api",
    extraEnv: {
      GOCACHE: path.join(rootDir, ".cache/go-build"),
      PORT: process.env.PORT || "8080",
    },
  },
  ui: {
    color: colors.magenta,
    cwd: rootDir,
    command: "pnpm --filter @habit-tracking/web dev",
  },
  db: {
    color: colors.yellow,
    cwd: rootDir,
    command: process.env.HABIT_DB_DEV_CMD || "",
    optional: true,
    missingMessage:
      "Set HABIT_DB_DEV_CMD to the database command you want to stream, for example `pg_ctl -D /opt/homebrew/var/postgresql@17 -l /tmp/habit-db.log start && tail -f /tmp/habit-db.log`.",
  },
};

const requestedStreams = normalizeRequestedStreams(process.argv.slice(2));

if (requestedStreams.length === 0) {
  printHelp();
  process.exit(1);
}

const loadedEnv = loadDotEnv(path.join(rootDir, ".env"));
const children = [];
let stopping = false;
let exitCode = 0;

for (const name of requestedStreams) {
  const config = streamConfigs[name];
  if (!config) {
    writeLine("runner", colors.red, `Unknown stream \`${name}\`.`);
    printHelp();
    process.exit(1);
  }

  if (!config.command) {
    if (config.optional) {
      writeLine(name, config.color, config.missingMessage);
      continue;
    }

    writeLine(name, colors.red, "No command configured.");
    exitCode = 1;
    continue;
  }

  const child = spawn(shell, ["-lc", config.command], {
    cwd: config.cwd,
    env: {
      ...process.env,
      ...loadedEnv,
      ...config.extraEnv,
    },
    stdio: ["inherit", "pipe", "pipe"],
  });

  children.push(child);
  wireStream(child.stdout, name, config.color);
  wireStream(child.stderr, name, colors.red);

  child.on("exit", (code, signal) => {
    const status = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    writeLine(name, colors.dim, `exited with ${status}`);

    if (!stopping && (code ?? 0) !== 0) {
      exitCode = code ?? 1;
      stopChildren(child.pid);
    }

    if (children.every((current) => current.exitCode !== null || current.signalCode !== null)) {
      process.exit(exitCode);
    }
  });
}

if (children.length === 0) {
  process.exit(exitCode);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    exitCode ||= 0;
    stopChildren();
  });
}

function normalizeRequestedStreams(args) {
  if (args.length === 0) {
    return ["backend", "ui", "db"];
  }

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  return [...new Set(args.flatMap((arg) => arg.split(",")).map((arg) => arg.trim()).filter(Boolean))];
}

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const raw = fs.readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function wireStream(stream, label, color) {
  let pending = "";

  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    pending += chunk;

    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? "";

    for (const line of lines) {
      writeLine(label, color, line);
    }
  });

  stream.on("end", () => {
    if (pending) {
      writeLine(label, color, pending);
      pending = "";
    }
  });
}

function writeLine(label, color, line) {
  const prefix = `${color}[${label}]${colors.reset}`;
  process.stdout.write(`${prefix} ${line}\n`);
}

function stopChildren(skipPid) {
  if (stopping) {
    return;
  }

  stopping = true;

  for (const child of children) {
    if (!child.pid || child.pid === skipPid || child.exitCode !== null || child.signalCode !== null) {
      continue;
    }

    child.kill("SIGTERM");
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
        continue;
      }

      child.kill("SIGKILL");
    }
  }, 2_000).unref();
}

function printHelp() {
  process.stdout.write(`Usage: pnpm dev [backend] [ui] [db]\n`);
}
