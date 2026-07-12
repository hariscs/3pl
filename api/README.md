# Lead API

Fastify + PostgreSQL + Prisma backend for the Lead mobile app (location check-in
and shift bootstrap). Implements the endpoints and domain described in
`client_requirments.txt`.

## Stack

- **Fastify 5** (fastify-cli, autoloaded plugins/routes)
- **Prisma 7** with the `@prisma/adapter-pg` driver adapter
- **PostgreSQL 17** (via Docker Compose)
- **TypeBox** for typed request/response schemas (strict TS, no `any`)
- **@fastify/jwt** for persistent Lead auth

## Setup

```bash
# 1. Start Postgres (host port 5433)
docker compose up -d

# 2. Copy env
cp .env.example .env

# 3. Install + generate client
pnpm install

# 4. Apply migrations + seed 3 locations and Lead "lead-001" (password: 1234)
pnpm migrate
pnpm seed

# 5. Run
pnpm dev          # watch mode on http://localhost:4000
```

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Build + run in watch mode |
| `pnpm start` | Build + run (production) |
| `pnpm typecheck` | Type-check `src/` and `prisma/` tooling |
| `pnpm migrate` | `prisma migrate dev` |
| `pnpm seed` | Seed the database |
| `pnpm db:reset` | Drop, re-migrate, re-seed |

## Endpoints

API routes are versioned under **`/api/v1`**. Health/info stay at the root for
infra probes.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | – | Liveness + DB check |
| `GET` | `/` | – | Service info |
| `POST` | `/api/v1/lead/auth/login` | – | Log in, returns JWT + active check-in |
| `GET` | `/api/v1/lead/session` | ✔ | Restore session on app launch |
| `GET` | `/api/v1/lead/locations` | ✔ | Assigned locations (check-in cards) |
| `POST` | `/api/v1/lead/check-ins` | ✔ | Start a shift at a location |
| `POST` | `/api/v1/lead/check-ins/:checkInId/checkout` | ✔ | End the current shift |
| `GET` | `/api/v1/locations/:locationId/bootstrap` | ✔ | Full shift dataset for the location |

Authenticate protected routes with `Authorization: Bearer <token>`.

## API docs (Swagger)

Interactive Swagger UI is served at **`/docs`** and the raw OpenAPI 3.1 spec at
**`/docs/json`** — generated automatically from the route TypeBox schemas. Use
the **Authorize** button in the UI to paste a JWT and try the protected routes.

## Notes

- Only one **active** check-in is allowed at a time (409 otherwise) — the shift
  must be ended via checkout before checking in elsewhere.
- Each seeded location has distinct customers, products, employees, pay/billing
  rules, loads, and contacts, so switching locations changes the whole dataset.
