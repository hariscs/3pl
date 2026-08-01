# codebase.md — Dockmaster / 3plwork

> Durable technical reference. Describes the system **as implemented**, verified against source (not against `PLAN.md` or old docs). For current work-in-progress, decisions, and gaps see [`memory.md`](memory.md). For exact endpoint-by-endpoint API surface see [`api-map.md`](api-map.md). For load/payroll/billing business logic see [`business-rules.md`](business-rules.md). For "where is X" see [`map.md`](map.md).
>
> Last verified: 2026-08-01 against commit `2142cc1`.

---

## 1. What this is

A 3PL (third-party logistics) dock-operations platform, sold as **Dockmaster** (package name `3plwork`). `Load` is the central operational record: Customer → Location → Work Type (Product Type) → Crew Assignments → Time/Breaks → Payroll/Billing/Invoices.

Three codebases are relevant, only two of which live in this repo:

| App | In this repo? | Role |
| --- | --- | --- |
| `api/` | ✅ | Fastify + Prisma + PostgreSQL backend. Serves the web dashboard (SystemUser JWT realm) and a separate mobile field app (Lead JWT realm). |
| `web/` | ✅ | Next.js 16 dashboard ("Dockmaster back-office"). |
| `threeplmobileapp` | ❌ separate repo, not here | React Native field app for Leads. Referenced in `PLAN.md`; the API's `lead/*` routes exist to serve it. Almost nothing about it can be verified from this repo — treat any claim about it as unverified. |

**No monorepo, no shared package.** `api/` and `web/` each have their own `package.json`/lockfile and are run independently (`cd api` / `cd web`). Full contributor conventions (package management, commit format, coding rules) live in [`AGENTS.md`](../AGENTS.md) — that file is canonical; this one is architecture/state, not conventions.

---

## 2. The one fact that changes how you read everything else

**`web/` implements a much richer domain model than `api/` actually serves.** This is not a documentation lag — it's a real, verified gap between two independently-evolved layers, and it is **intentional, not a bug**: the backend/DB tech stack has not been locked in yet, so `web/` is deliberately being built against mock data to demo to potential clients/partners ahead of a real backend commitment. Treat `api/`'s current Fastify+Prisma+Postgres implementation as a placeholder, not a locked direction — see `memory.md` for the current product decision. The technical facts below are still important to know before writing code, regardless of why the gap exists:

- `web/src/lib/types.ts` describes a 7-state `Load` lifecycle (`draft/scheduled/in_progress/paused/completed/closed/cancelled`), per-assignment clock-in/break/clock-out tracking, frozen pay/billing snapshots, crew certifications/skills/training, a 6-value `Role` union (`admin/manager/lead/finance/customer/employee`), and rich Customer/Location/ProductType fields (industry, billing terms, site contacts, etc.).
- `api/prisma/schema.prisma` implements an older, simpler model: `LoadStatus` is only `active/complete/void/archived`, `Role` is only `admin/lead`, `Employee` has no certifications/skills/training/`employeeId`/`payType`, `Customer`/`Location`/`ProductType` lack most of the rich fields above, and `ProductType` still uses the tiered `RateLine` rate-card model (which `web/`'s own code comments say has "zero live callers" on the frontend).
- **Invoices and Payroll have no backend routes at all.** They are 100% in-memory on the frontend (`web/src/lib/invoices.ts`, `web/src/lib/payroll.ts`).
- Most of the Load lifecycle actions the web UI calls (`pause`, `resume`, `complete`, `reopen`, `close`, `cancel`, crew `clock-in`/`break-start`/`break-end`/`clock-out`/`remove`, attachments) **do not exist as API routes** — see [`api-map.md`](api-map.md) for the verified route inventory. The real `loads` API only has list/get/create/update/`void`/`archive`.
- `updateUser`/`toggleUserArchive` (called from `web/src/lib/store.tsx`) have **no matching API route** — `api/src/routes/users/index.ts` only implements list + create.

**Why this doesn't break the app in normal dev use:** `web/src/lib/auth.tsx` auto-logs-in a fake admin session (`DEV_BYPASS_TOKEN`) whenever `NODE_ENV === "development"` and no real session exists. `web/src/lib/api/client.ts` intercepts **every** API call first through `handleMockRequest()` (`web/src/lib/mock-handlers.ts`), which implements the full rich model in-memory (backed by `web/src/lib/mock-data.ts`) and only falls through to a real `fetch()` against `api/` if the mock layer doesn't handle the path. In practice, dev-mode work happens almost entirely against the mock layer, not the real API — **only a real login (`/auth/login` with a seeded password) exercises the real backend**, and at that point most Load-lifecycle/user-edit/invoice/payroll actions will 404 or silently diverge from what the UI assumes.

**Implication for future work:** before wiring a `web/` feature to "the API," check [`api-map.md`](api-map.md) to see whether the route exists yet. Don't assume `lib/mock-handlers.ts` behavior describes `api/`'s behavior — they are two different implementations of two different schemas that happen to share type *names*.

---

## 3. Technology stack

| | `api/` | `web/` |
| --- | --- | --- |
| Framework | Fastify 5 (`fastify-cli`, autoloaded plugins/routes) | Next.js 16.2 + React 19.2 (app router) |
| Data | Prisma 7 + PostgreSQL 17 (via `@prisma/adapter-pg`) | TanStack Query 5 (server-state cache only — no DB) |
| Validation | TypeBox (`@sinclair/typebox`) — drives both runtime validation and generated Swagger | — |
| Auth | `@fastify/jwt`, two realms: SystemUser (dashboard) + Lead (mobile) | JWT in `localStorage`, sent as `Bearer`; dev-mode auto-bypass |
| Styling | — | Tailwind CSS v4, Biome 2.2 (lint+format) |
| PDF | — | `@react-pdf/renderer` (invoices, payroll reports) |
| Charts | — | Recharts 3 |
| Package manager | pnpm (own lockfile, `api/pnpm-lock.yaml`) | pnpm (own lockfile, `web/pnpm-lock.yaml`) |
| Tests | **none** | **none** |

No automated test suite exists anywhere in the repo (verified: no `*.test.*`/`*.spec.*` files). `api/`'s quality gate is `pnpm typecheck`; `web/` has no typecheck script (`npx tsc --noEmit` manually) and `pnpm lint` (Biome).

---

## 4. Repository structure

```
api/
  src/
    app.ts              → entry: registers @fastify/env + swagger, autoloads plugins/ and routes/ (mounted under /api/v1)
    config/              → env.ts (env schema), swagger.ts
    plugins/              → auth.ts (JWT + requireSystemUser/requireLead), prisma.ts, cors.ts, healthcheck.ts, sensible.ts, support.ts
    routes/               → autoloaded; directory path = URL path. See map.md § API
    schemas/              → TypeBox schemas — source of truth for validation + Swagger docs
    lib/                  → domain-serializers.ts (Prisma → response, dashboard domain), serializers.ts (Lead-realm), billing.ts (RateLine calc), leadAuth.ts
  prisma/
    schema.prisma         → source of truth for the DB (see § 2 — simpler than web/'s type model)
    migrations/            → 5 migrations, latest 20260716140000_employee_category
    seed.ts                → 3 locations (Savannah/Charlotte/Dallas), customers, employees, product types, loads, 1 admin + 1 lead

web/
  src/
    app/
      (app)/               → authenticated shell (layout.tsx = auth guard + Sidebar + AppDataProvider); every page below requires a session
      login/, forgot-password/  → public routes
    components/            → see map.md § Shared UI — ui/ = primitives, forms/ = entity forms, loads/, dashboard/, invoices/, payroll/, intelligence/
    lib/
      types.ts             → all shared domain types (the "rich" model — see § 2)
      store.tsx             → AppDataProvider: 6 parallel TanStack Query fetches (locations/customers/employees/productTypes/loads/users) + all mutations
      api/client.ts          → typed fetch wrapper; routes every call through the mock layer first, real API second
      auth.tsx, token.ts      → session state, localStorage, dev-mode bypass
      mock-data.ts, mock-handlers.ts → the in-memory backend most dev work actually runs against
      dashboard.ts            → single source of truth for every Dashboard metric/row/chart-point
      load-*.ts (financials, time, readiness, attachments) → Load domain business logic, see business-rules.md
      invoices.ts, payroll.ts, billing.ts → Finance domain, entirely frontend-only (no API backing)
      intelligence*.ts, mocks/  → "3PL Intelligence" AI chat feature — fully mocked/demo, see § 7
```

---

## 5. Authentication & authorization

Two independent JWT realms, both issued/verified by `api/src/plugins/auth.ts` (`fastify.authenticate`, `fastify.requireSystemUser`, `fastify.requireLead`):

- **SystemUser realm** — the dashboard. `POST /api/v1/auth/login` (`api/src/routes/auth/index.ts`). Token payload: `{ sub, email, name, role, locationId, realm: "system" }`. Back-office routes (`customers`, `employees`, `loads`, `product-types`, `locations`, `users`) all hook `requireSystemUser` at the plugin level.
- **Lead realm** — the mobile field app. `POST /api/v1/lead/auth/login` plus a refresh-token flow (`api/src/lib/leadAuth.ts`, `RefreshToken` Prisma model). Token payload: `{ sub, email, name, role, realm: "lead" }`.
- **Prisma's `Role` enum is `admin | lead` only** (locked per `PLAN.md`'s "Roles: Admin + Lead only" decision). **`web/`'s `Role` type still has 6 values** (`admin/manager/lead/finance/customer/employee`) and `UserForm.tsx` lets you create all of them — but only `admin`/`lead` accounts can actually be authenticated against the real `SystemUser` model as it exists in Postgres today. This is the same class of gap as § 2, applied to roles specifically.

**Web-side:** `web/src/lib/auth.tsx` — `AuthProvider` restores a session from `localStorage` (`dockmaster.token` / `dockmaster.user`, see `token.ts`), or in dev mode seeds a fake `DEV_BYPASS_TOKEN` admin session automatically. `web/src/app/(app)/layout.tsx` is the auth guard: redirects to `/login` if unauthenticated, otherwise mounts `AppDataProvider` + `Sidebar`. `web/src/components/AdminOnly.tsx` gates admin-only page content client-side (not a route guard).

Seeded logins (password `1234` for everyone) are documented in [`README.md`](../README.md).

---

## 6. Frontend architecture (`web/`)

- **App router**, one authenticated route group `(app)` plus public `login/` and `forgot-password/` routes. Nearly all interactive components are `"use client"` — this app leans client-heavy (TanStack Query + context), not RSC-heavy, despite Next.js 16 defaulting to Server Components. `web/AGENTS.md` warns this Next.js version has breaking changes vs. training data — read `web/node_modules/next/dist/docs/` before assuming an API.
- **State/data flow:** `AppDataProvider` (`lib/store.tsx`) fetches 6 entity lists in parallel via TanStack Query on mount, exposes them + every mutation through `useAppData()`. Data that's too specific/heavy to join into that app-boot fetch (load attachments, invoices, per-employee payroll status) gets its own small `use-*.ts` query hook fetched on demand (`use-load-attachments.ts`, `use-invoices.ts`, `use-payroll-records.ts`).
- **Mutations** go through `withToast()` (in `store.tsx`) — call API → invalidate the relevant query key → success/error toast. Fire-and-forget: failures resolve to `undefined` rather than rejecting, so callers don't need try/catch.
- **Mock layer:** `lib/mock-handlers.ts` intercepts every `api.get/post/patch` call by URL pattern before it reaches `fetch()`, whenever `handleMockRequest()` returns a match. It implements full CRUD + Load lifecycle + crew clock events + attachments + invoices + payroll status against in-memory arrays cloned from `lib/mock-data.ts`. This is a parallel, independent implementation of the backend — not a proxy to `api/`.
- **Dashboard** (`app/(app)/page.tsx`): role-aware aggregation layer, not a static page. `lib/dashboard.ts` is the single place every metric/row/chart-point is computed (`buildScope`, `selectScopedLoads`, `selectPeriodLoads`, then per-section `get*` functions). "Live" sections (Operations Now, Attention Required, Workforce Overview) ignore the date-range filter; "period" sections (Financial Workflow, Performance, Trends) respect it.
- **"3PL Intelligence"** (`app/(app)/intelligence/`, `components/intelligence/`, `lib/intelligence*.ts`): a full-screen AI chat workspace (hides the Sidebar when active) with knowledge base, evidence panel, streaming responses. **Fully mocked** — `lib/mocks/intelligenceResponse.ts` / `intelligenceStream.ts` simulate responses (`metadata.demo: true` on every response type); there is no real LLM call and no backend route for it anywhere in `api/`. Treat this entire module as a UI demo, not a working AI feature, unless you find evidence otherwise when you open it.

---

## 7. Backend architecture (`api/`)

- **Autoloaded routes**: `api/src/routes/<path>/index.ts` → `/api/v1/<path>` (via `@fastify/autoload`, configured in `app.ts`). Health/service-info stay unversioned at `/health` and `/`.
- **Route handlers are thin**: validate via TypeBox `schema`, call `fastify.prisma`, map through a `domain-serializers.ts`/`serializers.ts` function, return. Never return raw Prisma objects (enforced by convention, verified true in every route file read).
- **`lib/domain-serializers.ts`** is the single mapping layer Prisma ↔ response for the back-office domain (`toLocation`, `toCustomer`, `toEmployee`, `toProductType`, `toLoad`, `toSystemUser`) plus the Lead-realm's `toLead`. `lib/serializers.ts` handles the older Lead check-in/session shapes.
- **Billing**: `lib/billing.ts`'s `calculateLoadAmounts(rateLines, qty)` computes `billedAmount`/`payoutAmount` from a `ProductType`'s tiered `RateLine[]` — only invoked when a Load's status is `complete` (see `computeBilling` in `routes/loads/index.ts`). This is the *only* real (non-mock) billing calculation in the system, and it uses the older rate-card model, not the `paySnapshot`/`billingSnapshot` model `web/`'s types describe.
- **Config**: all env access goes through `fastify.config` (validated by `config/env.ts` via `@fastify/env`) — never `process.env` in a handler.
- **Full verified endpoint inventory**: [`api-map.md`](api-map.md). `api/README.md` also has a hand-maintained table that matches what was verified here.

---

## 8. Database (`api/prisma/schema.prisma`)

Two logical halves in one schema, one Postgres database:

**Back-office domain** — `Location`, `Customer`, `Employee`, `ProductType` + `RateLine`, `Load` + `LoadEmployeeAssignment`, `SystemUser`. Customer↔Location and Customer↔ProductType are implicit Prisma many-to-many; `Employee`/`ProductType`/`Load` each belong to exactly one `Location` (required FK, `onDelete: Cascade`). `Load.status` is a 4-value enum (`active/complete/void/archived`) — **not** the 7-state lifecycle `web/` assumes.

**Lead field-app domain** — `Lead`, `RefreshToken`, `LeadAssignment` (join: Lead × Location, one row per assignment, `@@unique([leadId, locationId])`), `CheckIn` (one active check-in per Lead at a time, enforced in the route handler, not the schema). `Location` carries Lead-app-specific config as JSON blobs: `containerFields`, `permissions`, `featureFlags` (typed via `serializers.ts`'s `asContainerFields`/`asPermissions`/`asFeatureFlags`).

No soft-delete convention beyond `RecordStatus`/`LoadStatus` enums (`active`/`archived`/etc.) — there's no separate `deletedAt` audit column anywhere. No row-level tenant isolation beyond FK ownership (single-tenant system; every `SystemUser` sees every `Customer`/`Load` — access scoping like `locationIds` is enforced client-side in `web/`, not at the query layer in `api/`). 5 migrations exist; `schema.prisma` is the source of truth per `AGENTS.md` — always re-derive from it, never assume.

---

## 9. Major web modules (business-rule detail in `business-rules.md`)

| Module | Routes | Notes |
| --- | --- | --- |
| Dashboard | `/` | See § 6. Role-aware: `lead` never sees Financial Workflow; `finance` hides live-ops sections; `customer`/`employee` blocked entirely. |
| Loads | `/loads`, `/loads/new`, `/loads/[id]` | 7-state lifecycle, crew assignments with their own 5-state lifecycle, frozen pay/billing snapshots — all mock-layer only against the real API today (§ 2). |
| Master Data | `/customers`, `/crew` (routes as `/employees` in nav label "Crew"), `/locations`, `/product-types` (UI label "Work Types") | Standard CRUD + archive/restore. `/product-types` route path kept for backward compatibility; UI text says "Work Type" throughout. |
| Payroll | `/finance/payroll`, `/finance/payroll/[id]` | Reads each Load's frozen `paySnapshot`; **no backend** — `lib/payroll.ts` computes client-side from mock Load data. |
| Customer Billing | `/finance/customer-billing` | Select completed/closed loads → create invoice. **No backend.** |
| Invoices | `/finance/invoices`, `/finance/invoices/[id]` | In-memory store `lib/invoices.ts`. **No backend**, no persistence beyond the session. |
| Reports | `/reports/load-entry`, `/reports/load-report`, `/reports/invoice` (legacy) | Read-only views over the same mock Load data, CSV export. |
| 3PL Intelligence | `/intelligence`, `/intelligence/knowledge` | Demo-only AI chat (§ 6). |

---

## 10. Shared components (selected — full list in `map.md`)

| Component | Path | Purpose |
| --- | --- | --- |
| `FilterableTable` | `components/FilterableTable.tsx` | Generic filterable/sortable table: search, filter chips, CSV export, `initialFilterValues` for deep-linking |
| `LoadStatusPill` | `components/loads/LoadStatusPill.tsx` | `StatusPill` wrapper for the 7-state `LoadStatus` |
| `StampBadge` | `components/StampBadge.tsx` | Legacy 2-tone badge — superseded by `StatusPill`/`LoadStatusPill` for Load status, still used elsewhere. Don't build new status UI on this pattern. |
| `DocumentViewer` | `components/ui/DocumentViewer.tsx` | Full-screen PDF preview modal (Download + Print), used by Payroll/Invoice PDFs |
| `AdminOnly` | `components/AdminOnly.tsx` | Client-side role gate (not a route guard) |
| `ui/` primitives | `components/ui/` | `Button`, `Card`, `Field`, `Modal`, `SelectMenu`, `StatCard`, `ActionsMenu`, `ConfirmDialog`, `SidekickPanel`, `SectionHeader`, `StatusPill` — reuse these, don't rebuild |

---

## 11. Known structural weaknesses (verified)

> Most of these are byproducts of the deliberate frontend-first/demo-first strategy (§ 2, `memory.md`), not oversights — listed here so they're accounted for in any estimate or design decision, not as a to-do list.

- **The `api/`↔`web/` model gap is the dominant architectural fact** — see § 2. Intentional for now (backend tech undecided, `web/` is demo-driven). Any task that says "connect X to the real API" needs an `api-map.md` check first, and should treat `api/`'s current schema as provisional.
- **No automated tests anywhere.**
- **No pagination** on any list — everything fetches and renders in full.
- **No mobile responsiveness** — desktop-first.
- **Load attachments are session-only** (`URL.createObjectURL`) in the mock layer; there's no attachment persistence or route in `api/` at all.
- **Production-type payout split is an even split** across every assignment with worked time — no per-worker unit attribution (mock-layer business rule, see `business-rules.md`).
- **Overtime premium uses a flat `employee.hourlyRate × 1.5` baseline**, not each contributing Load's own snapshot rate (mock-layer business rule, documented as an open business question, not a bug).
- **`Role` has 6 values in `web/` vs 2 in the real `SystemUser` model** — see § 5.
- **`PLAN.md`** (repo root) is a large, partially-stale planning document — the "Progress" line at its top is dated 2026-07-16 and predates the crew/dashboard/intelligence work visible in git log through 2026-08-01. Useful for historical business context (client decisions, phase numbering) but not a reliable status source — trust code over it.
