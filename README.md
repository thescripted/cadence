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
```

7. If you want the mobile app too, start Expo in another terminal:

```bash
pnpm dev:mobile
```

The web app and mobile app both talk to the API at `http://127.0.0.1:8080` by default.
