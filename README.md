# 3plwork

A 3PL dock-operations platform in two parts:

- **`api/`** — Fastify + Prisma + PostgreSQL backend. Serves the Dockmaster back-office dashboard **and** the Lead mobile field app from one unified domain.
- **`web/`** — Next.js dashboard (the Dockmaster back-office).

The two apps are **independent** — each has its own `package.json` and lockfile. There is no monorepo/workspace.

## Stack

| | Backend (`api/`) | Frontend (`web/`) |
| --- | --- | --- |
| Framework | Fastify 5 (fastify-cli, autoloaded plugins/routes) | Next.js 16 + React 19 (app router) |
| Data | Prisma 7 + PostgreSQL 17 | TanStack Query (server state) |
| Schemas | TypeBox (validation + Swagger) | — |
| Auth | `@fastify/jwt` (Lead + SystemUser tokens) | JWT in `localStorage`, sent as `Bearer` |
| Styling / tooling | `tsc` (typecheck gate) | Tailwind 4, Biome 2.2 |

## Quickstart

### 1. Backend

```bash
cd api
docker compose up -d          # Postgres 17 on host port 5433
cp .env.example .env          # set JWT_SECRET for anything non-local
pnpm install
pnpm migrate                  # apply migrations
pnpm seed                     # seed locations, customers, loads, users
pnpm dev                      # http://localhost:4000  (Swagger UI at /docs)
```

### 2. Frontend

```bash
cd web
pnpm install
# web/.env.local already points at NEXT_PUBLIC_API_URL=http://localhost:4000
pnpm dev                      # http://localhost:3000
```

### Seeded logins

| Surface | Credentials |
| --- | --- |
| Dashboard (`web/`) | `rick@dockmaster3pl.com` / `1234` (admin) |
| Lead mobile app (API) | login id `lead-001` / `1234` |

All three seeded dashboard users share the password `1234`.

## Structure

```
api/
  src/
    app.ts        → entry: env + swagger, autoloads plugins/ and routes/ (under /api/v1)
    plugins/      → cross-cutting: auth (JWT), prisma, cors, healthcheck…
    routes/       → autoloaded route plugins (folder path = URL path)
    schemas/      → TypeBox request/response schemas
    lib/          → serializers (Prisma → response), billing
  prisma/         → schema.prisma, migrations, seed.ts
web/
  src/
    app/          → app router: (app) authed shell, plus login/ and forgot-password/
    components/   → shared components; components/ui/ = primitives
    lib/          → api/client.ts, store.tsx, auth.tsx, types.ts, billing.ts
```

## Auth model

- **Two JWT identities**, both verified by the `authenticate` decorator in `api/src/plugins/auth.ts`:
  - **Lead** tokens — the mobile field app (`/api/v1/lead/*`).
  - **SystemUser** tokens — the dashboard, issued by `POST /api/v1/auth/login`.
- The back-office routes (`customers`, `employees`, `loads`, `product-types`, `locations`, `users`) require a valid token.
- The web app stores its token in `localStorage`, attaches it as a `Bearer` header, and redirects to `/login` on `401`.

## API docs

Swagger UI is served at **`http://localhost:4000/docs`**; the raw OpenAPI spec at `/docs/json`. See `api/README.md` for the full endpoint list.

## Working in this repo

Agent/contributor conventions (package management, architecture rules, coding style, commit format) live in **[`AGENTS.md`](AGENTS.md)**. `.claude/CLAUDE.md` just imports it.
