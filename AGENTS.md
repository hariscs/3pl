# AGENTS.md

Guidance for anyone (human or AI) working in this repo. This is the **canonical conventions file**; `.claude/CLAUDE.md` just imports it. Setup and structure live in [`README.md`](README.md).

## The one thing to get right

This is **two independent apps, not a monorepo** — there is no root `package.json` and no pnpm workspace:

- `api/` → Fastify + Prisma + TypeBox backend
- `web/` → Next.js dashboard

Run every `pnpm` command **from inside the app** you're changing (`cd api` or `cd web`). There is no root to install or run from.

## Gotchas that will bite you (TL;DR)

- **Don't run long-running dev servers** (`pnpm dev`, `fastify start -w`, `next dev`) unless the user has explicitly said so in the current session. Otherwise output the command for the human to run instead. When authorized, run it in the background and stop it when done.
- **`web/` is Next.js 16** — breaking changes vs. common training data. Read the guide in `web/node_modules/next/dist/docs/` before writing web code (see `web/AGENTS.md`).
- **The two apps share no code.** API response shapes (`api/src/schemas/domain.ts`) and web types (`web/src/lib/types.ts`) are mirrored **by hand** — change both together.
- **API validation is TypeBox, not Zod.** Schemas live in `api/src/schemas/`; derive types with `Static<typeof Schema>`.
- **Never return raw Prisma objects** from a route — map through a `lib/*serializers.ts` helper.
- **Prisma schema is the source of truth** — derive from `api/prisma/schema.prisma`, never assume it.

---

## Package Management Rules

There is no root `package.json` and no pnpm workspace. Each app has its own `package.json` and `pnpm-lock.yaml`:

- `api/` → Fastify backend
- `web/` → Next.js frontend

**Run `pnpm` commands from inside the app you're working on** (`api/` or `web/`). There is no root to install from.

**Never manually edit `package.json` to add dependencies.** Always use `pnpm add` so the correct version is resolved and `pnpm-lock.yaml` stays in sync.

```bash
# ✅ Install a dependency for the backend
cd api && pnpm add <pkg>

# ✅ Install a dev dependency for the frontend
cd web && pnpm add -D <pkg>

# ✅ Install everything (per app)
cd api && pnpm install
cd web && pnpm install

# ❌ Never do this — there is no workspace root
pnpm add <pkg>            # (from the repo root)
```

**When to install where:**

| Scope             | Install in | Example                     |
| ----------------- | ---------- | --------------------------- |
| Web frontend only | `web/`     | `next`, `@tanstack/react-query` |
| API only          | `api/`     | `fastify`, `@fastify/jwt`, `prisma` |

There is no shared package — a type or shape used by both apps is **mirrored manually** (see Shared Code Rule).

---

## Commands

### API (`api/`)

```bash
pnpm dev                    # Build + run in watch mode (long-running — see Forbidden Actions)
pnpm start                  # Build + run (production)
pnpm typecheck              # Type-check src/ and prisma tooling — the API quality gate
pnpm migrate                # prisma migrate dev
pnpm seed                   # Seed the database
pnpm db:reset               # Drop, re-migrate, re-seed
docker compose up -d        # Start Postgres 17 (host port 5433)
```

### Web (`web/`)

```bash
pnpm dev                    # Next.js dev server (long-running — see Forbidden Actions)
pnpm build                  # Next.js production build
pnpm start                  # Next.js production server
pnpm lint                   # Biome check (lint + format)
pnpm format                 # Biome format --write
```

There is no separate `typecheck` script in `web/`; run `npx tsc --noEmit` from `web/` when you need a type-only check.

---

## Architecture

**Stack:** Next.js 16 + React 19 (web), Fastify 5 + fastify-cli (API), PostgreSQL 17 + Prisma 7 (database), TypeBox (typed request/response schemas), `@fastify/jwt` (auth). Two independent apps, each with its own tooling — no Nx, no workspace.

### Repo Structure

```
api/                → Fastify backend
web/                → Next.js frontend (app router)
```

### API Structure (`api/src/`)

```
app.ts              → entry: registers env + swagger, then autoloads plugins/ and routes/ (routes mounted under /api/v1)
config/             → env.ts (env schema validated by @fastify/env), swagger.ts
plugins/            → cross-cutting, autoloaded: auth.ts (JWT + `authenticate`), prisma.ts, cors, sensible, healthcheck, support
routes/             → autoloaded route plugins; the folder path maps to the URL path
schemas/            → TypeBox request/response schemas (source of truth for validation + Swagger)
lib/                → serializers (Prisma → response), billing
```

```
prisma/             → schema.prisma (source of truth for the DB), migrations/, seed.ts
```

**Request flow:** `route handler → fastify.prisma → DB`, mapping the result through a serializer before returning.

Routes are autoloaded, so **the directory is the route** — `routes/customers/index.ts` serves `/api/v1/customers`. Auth is a Lead JWT (mobile field app) or a SystemUser JWT (dashboard); both are verified by the `authenticate` decorator in `plugins/auth.ts`.

### Web Structure (`web/src/`)

```
app/                → app router. Route groups: (app) = authenticated shell, plus public routes login/, forgot-password/
components/          → shared components; components/ui/ = primitives (Button, Card, Field, Modal, …)
lib/                → api/client.ts (fetch wrapper), store.tsx (AppData context + TanStack Query), auth.tsx, types.ts, billing.ts
```

The web app talks to the API through `lib/api/client.ts` and caches server state with TanStack Query inside `lib/store.tsx`.

> ⚠️ **Next.js version note** (see `web/AGENTS.md`): this Next.js has breaking changes vs. training data. Read the relevant guide in `web/node_modules/next/dist/docs/` before writing web code.

### Shared Code Rule

There is no shared package. When a shape is used by both apps, the API TypeBox schema (`api/src/schemas/domain.ts`) and the web type (`web/src/lib/types.ts`) are kept in sync **by hand**. If you change one, update the other in the same task.

---

## Simplicity First (MANDATORY)

Always prefer the simplest solution that satisfies the requirement.

- **Readability over cleverness** — straight-line logic beats nested abstractions
- **Explicit over abstract** — one function per purpose, not generic reusable utilities
- **Duplication over premature reuse** — small duplication is acceptable; promote only when logic appears in 3+ places
- **Working over "perfect architecture"** — no design patterns unless explicitly required, no micro-optimizations, no generics for hypothetical flexibility

**Strict prohibitions:**

- ❌ No premature abstractions
- ❌ No generic utility functions unless used in 3+ places
- ❌ No "helper" layers that hide simple logic
- ❌ No design patterns unless explicitly required
- ❌ No overuse of generics for "flexibility"

**Allowed trade-offs:**

- ✅ Small duplication is acceptable
- ✅ Slightly longer code is acceptable if clearer
- ✅ Hardcoding is acceptable if stable and obvious

**Decision rule:** if multiple implementations are possible, choose the one that is easiest to read in 10 seconds, has the fewest moving parts, and requires the least mental context.

**Refactoring rule:** do NOT refactor for abstraction unless the same logic appears in 3+ places, or the user explicitly asks.

```ts
// ❌ Over-engineered
function createHandler<T>(repo: Repo<T>) {
  return async (data: T) => repo.create(data)
}

// ✅ Simple and direct
await fastify.prisma.customer.create({ data })
```

---

## Coding Rules

- **Laconic code** — prefer concise expressions. Avoid unnecessary variables and over-engineered abstractions.
- **Minimal comments** — code should be self-explanatory. Add a comment only when logic is genuinely non-obvious (algorithm, workaround, hidden constraint, why-not-what).
- **`type` over `interface`** — prefer `type`. Exception: module augmentation / extending third-party declarations (e.g. `declare module 'fastify'`), which require `interface`.
- **No `any`** — use `unknown` for truly unknown values, generics for parameterized types. If you touch a file with `any`, replace it.
- **Early returns** — reduce nesting by returning early instead of `if/else` chains.
- **No magic numbers/strings** — extract literals into named constants near usage.
- **Collocate related code** — keep types and helpers close to usage. There is no shared package to promote into; mirror cross-app shapes by hand (see Shared Code Rule).
- **Named exports only** — no default exports except where a framework requires it (Next.js pages/layouts; Fastify autoloaded route/plugin modules).
- **`as const` over enum** — define constants with `as const` and derive union types via `typeof obj[keyof typeof obj]`. (Prisma-generated enums are the exception — use them as generated.)
- **No `console.log`** — in the API use Fastify's logger (`request.log` / `fastify.log`); in the web app do not commit `console.log`.
- **Sorted Tailwind classes** — keep Tailwind classes ordered in the web app; run `pnpm format` from `web/`.

---

## TypeScript Rules

- **No `any`** — use `unknown`, generics, or schema inference. Never cast with `as Type` unless a third-party type is genuinely wrong.
- **`type` over `interface`** — always, except module augmentation / extending third-party declarations.
- **`as const` over enum** — use `as const` objects and derive union types. Never a hand-written TypeScript `enum` (Prisma-generated enums excepted).
- **No non-null assertions (`!`)** — use optional chaining (`?.`), nullish coalescing (`??`), or early returns.
- **Let TypeScript infer** — don't annotate return types or variable types when inference is correct. Annotate only at module boundaries.
- **Narrow errors in catch** — errors are `unknown`. Always narrow: `if (e instanceof Error)`. Never `catch (e: any)`.
- **Discriminated unions over optional fields** — model state variants as discriminated unions, not optional fields.

---

## Validation Rules (TypeBox)

- API request/response schemas live in `api/src/schemas/` — never inline schemas in route handlers when a reusable shape exists.
- Derive the TS type from the schema: `type X = Static<typeof XSchema>`. Don't hand-write a parallel type.
- Register schemas on the route (`schema: { body, params, response }`) — this drives both runtime validation and the generated Swagger docs.
- Compose with `Type.Partial(...)`, `Type.Union([...])`, `Type.Array(...)` rather than duplicating fields.
- Use the shared `ErrorResponseSchema` for error responses so the docs stay consistent.
- Nullable DB fields: model as `Type.Union([X, Type.Null()])` — Prisma returns `null` (not `undefined`) for unset fields.

---

## Separation of Concerns (Fastify API)

- **Authentication/authorization in hooks** — protect routes with the `authenticate` preHandler or a plugin-level `onRequest` hook, never with auth logic scattered inside handlers.
- **Route handlers are thin** — validate via schema, call `fastify.prisma`, serialize, return. Keep non-trivial business logic in a `lib/` helper.
- **Serializers map Prisma → response** — use the `lib/*serializers.ts` helpers. **Never return raw Prisma objects** from a handler; always map to the response shape.
- **Cross-cutting concerns are plugins** — anything shared (auth, prisma client, cors, error handling) lives in `src/plugins/` and is autoloaded.
- **Config through `@fastify/env`** — read config from `fastify.config`, validated by the schema in `config/env.ts`. Never read `process.env` directly in handlers.

---

## Web Architecture (Next.js)

- **Server Components by default** — only add `'use client'` when you need browser APIs, event handlers, or React hooks.
- **TanStack Query for all client-side server state** — go through `lib/store.tsx` / `lib/api/client.ts`; no ad-hoc `fetch` + `useState` + `try/catch` scattered in components.
- **Reuse the UI primitives in `components/ui/`** — never rebuild a Button/Field/Modal from scratch. This project has its own primitives (not shadcn); extend those.
- **Controlled forms with local state** — forms use controlled inputs + `useState` (the existing pattern). Validate on submit and surface errors inline.
- **No pass-through fetching** — if only one child needs data, that child reads it from the store/query directly. Don't fetch in a parent just to pass a prop.

---

## Code Style

**Web (`web/`) — Biome 2.2**

- 2-space indent, `organizeImports` on, `next`/`react` lint domains enabled.
- Run `pnpm lint` (check) and `pnpm format` (write) from `web/`.

**API (`api/`) — TypeScript / `fastify-tsconfig`**

- 2-space indent; strict compiler settings inherited from `fastify-tsconfig`.
- There is no linter in the API — `pnpm typecheck` is the quality gate. Run it before considering API work done.

---

## Feature Execution Protocol

When implementing any feature, follow this sequence:

**Step 1 — Understand Requirements**

- Identify: affected app(s) (`api`, `web`, or both), which endpoints, which DB models, and whether the web ↔ API shapes need to stay in sync.

**Step 2 — Plan (DO NOT CODE YET)**

- Output: files to create/update, API endpoints, data flow (request → response), edge cases.
- Wait for user confirmation before writing code.

**Step 3 — Implement Incrementally**

- Implement in small steps, not the whole feature at once.
- API layer order: `schema → route handler → prisma → serializer`.

**Step 4 — Provide Manual Test Instructions**

- After each step, output: curl/request example, expected response, expected DB change.

**Step 5 — Commit Message**

- After each completed step, output the commit message in the standard format.

---

## Forbidden Actions

- **Never run long-running dev servers** (`pnpm dev` in `api/` or `web/`, `fastify start -w`, `next dev`) unless the user explicitly authorizes it in the session — otherwise output the command for the user to run. When authorized, run in the background and stop it when the task is done.
- **Never assume the Prisma schema** — always derive from `api/prisma/schema.prisma`.
- **Never mix layers** — no DB calls that skip serialization, no `process.env` reads inside handlers.
- **Never return raw Prisma objects** — map through a serializer first.
- **Never add `console.log`** — use Fastify's logger in the API; keep `console.log` out of committed web code.
- **Never change existing code outside the assigned task** — if a problem is spotted in unrelated code, complete the task first, then report the issue at the end. Only fix it when the user explicitly asks.

---

## Commit Format

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Scopes: `api`, `web` (or omit the scope for repo-wide changes).

Examples:

```
feat(api): add system-user login endpoint
fix(web): attach bearer token to API requests
chore(api): seed dashboard users with a password
refactor(web): move data provider under the auth guard
```
