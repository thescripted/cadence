# Habit Tracking

Monorepo scaffold for a personalized habit tracker consistency toolkit.

## Layout

- `apps/api`: Go API using `net/http`
- `apps/web`: React web app using Vite and Radix Themes
- `apps/mobile`: Expo mobile app
- `packages/shared`: shared TypeScript types and constants
- `infra/postgres/migrations`: SQL schema migrations

## MVP backend scope

The initial backend includes:

- configuration loading from environment variables
- HTTP server bootstrap
- health endpoints
- database connection plumbing
- first Postgres migration for the MVP schema

## Local development

The repo is scaffolded so the next steps are:

1. install workspace dependencies with `pnpm install`
2. install a Postgres server locally or connect to an existing instance
3. run the schema and seed migrations
4. start the API and verify database connectivity

See `.env.example` for the required environment variables.

### API

Build the API:

```bash
cd apps/api
GOCACHE=$(pwd)/.cache/go-build go build ./...
```

Run the API:

```bash
cd apps/api
PORT=8080 DATABASE_URL=postgres://YOUR_LOCAL_DB_USER@localhost:5432/habit_tracking?sslmode=disable GOCACHE=$(pwd)/.cache/go-build go run ./cmd/api
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

### Verification

Check health:

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

Run the web client:

```bash
pnpm dev:web
```

Run the Expo client:

```bash
pnpm dev:mobile
```
