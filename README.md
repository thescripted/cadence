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

## Root Scripts

Start the full local stack with prefixed, streamed logs:

```bash
DATABASE_URL=postgres://YOUR_LOCAL_DB_USER@localhost:5432/habit_tracking?sslmode=disable npm run dev
```

Start individual surfaces:

```bash
npm run dev:api
npm run dev:web
npm run dev:mobile
```

Build targets:

```bash
npm run build:api
npm run build:web
```

`npm run dev` uses `concurrently`, so the API, web app, and Expo dev server stream together with separate prefixes.

## Running The App

5. Start the API:

```bash
DATABASE_URL=postgres://YOUR_LOCAL_DB_USER@localhost:5432/habit_tracking?sslmode=disable npm run dev:api
```

6. In a new terminal, start the web app:

```bash
npm run dev:web
```

7. If you want the mobile app too, start Expo in another terminal:

```bash
npm run dev:mobile
```

The web app and mobile app both talk to the API at `http://127.0.0.1:8080` by default.
