# Habit Tracking

Habit Tracking is a small monorepo for a personal habit tracker. It includes:

- a Go API for habits, daily logs, notes, and weekly recaps
- a React web app
- an Expo mobile app
- shared TypeScript package code
- Postgres migrations for the app data

## Install

1. Install dependencies:

```bash
pnpm install
```

2. Create a local environment file from the example:

```bash
cp .env.example .env
```

3. Create a Postgres database named `habit_tracking`.

4. Run the migrations:

```bash
psql -d habit_tracking -f infra/postgres/migrations/0001_initial_schema.sql
psql -d habit_tracking -f infra/postgres/migrations/0002_seed_default_user.sql
```

5. Start the API:

```bash
cd apps/api
set -a
source ../../.env
set +a
GOCACHE=$(pwd)/.cache/go-build go run ./cmd/api
```

6. In a new terminal, start the web app:
```bash
pnpm dev:web
pnpm dev:ui
```

You can also start the backend from the repo root with the colorized log stream:

```bash
pnpm dev:backend
```

### Postgres

Create the database:

```bash
/opt/homebrew/opt/postgresql@17/bin/createdb -h localhost -U YOUR_LOCAL_DB_USER habit_tracking
```

Apply the migration:

```bash
/opt/homebrew/opt/postgresql@17/bin/psql -h localhost -U YOUR_LOCAL_DB_USER -d habit_tracking -f infra/postgres/migrations/0001_initial_schema.sql
/opt/homebrew/opt/postgresql@17/bin/psql -h localhost -U YOUR_LOCAL_DB_USER -d habit_tracking -f infra/postgres/migrations/0002_seed_default_user.sql
```

If you want the database to participate in the shared colorized log runner, set `HABIT_DB_DEV_CMD` to the command you use to start or tail your database logs:

```bash
HABIT_DB_DEV_CMD='tail -f /tmp/habit-db.log' pnpm dev:db
```

### Verification

Check API health:

```bash
curl -s http://127.0.0.1:8080/healthz
curl -s -i http://127.0.0.1:8080/readyz
curl -s http://127.0.0.1:8080/habits
curl -s -X PATCH http://127.0.0.1:8080/habits/1 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Water intake","targetValue":10}'
curl -s http://127.0.0.1:8080/today
curl -s -X PUT http://127.0.0.1:8080/today/log \
  -H 'Content-Type: application/json' \
  -d '{"habitId":1,"status":"logged","value":1}'
curl -s -X PUT http://127.0.0.1:8080/today/note \
  -H 'Content-Type: application/json' \
  -d '{"note":"Solid day overall."}'
curl -s http://127.0.0.1:8080/recap/week
```

7. If you want the mobile app too, start Expo in another terminal:

```bash
pnpm dev:mobile
```

The web app and mobile app both talk to the API at `http://127.0.0.1:8080` by default.

### Combined log streams

Run the backend, web UI, and optional DB stream in one terminal with color-coded prefixes:

```bash
pnpm dev
```

Run only the streams you want:

```bash
pnpm dev backend ui
pnpm dev backend
pnpm dev ui db
```

The runner loads `.env` from the repo root for the backend automatically, so you do not need to retype `DATABASE_URL` each time.
