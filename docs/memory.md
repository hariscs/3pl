# memory.md — Current project context

> **Last updated:** 2026-08-01
> Compact, actively maintained. Not a chronological log — stale entries get removed/merged, not appended forever. Stable architecture facts belong in `codebase.md`/`api-map.md`/`business-rules.md`, not here.

## Current phase

`web/` is in active, fast-moving visual/feature development against its own in-memory mock layer (dev-bypass auto-login, see `codebase.md` § 2). `api/` has been comparatively static since mid-July — it implements an earlier, simpler version of the domain that `web/` has since outgrown.

**This is intentional, not an oversight (confirmed by the user, 2026-08-01):** the backend and frontend are deliberately disconnected right now. The DB/backend tech stack has **not been locked in** — `api/`'s current Fastify + Prisma + PostgreSQL implementation should be treated as a placeholder/prototype, not a committed direction. `web/` runs entirely on mock data on purpose, so it can be demoed to potential clients and partners without a real backend behind it. Don't read the `api/`↔`web/` gap as a bug to fix or flag as broken — it's the expected current state. Do keep flagging it when it's *relevant* to a task (e.g. "this will need a real backend before it can go beyond demo"), since it still affects what's safe to promise or build on.

Treat any "wire this up to the real API" request as new backend work, not a wiring task — check `api-map.md` for what exists today, but don't assume `api/`'s current schema is what the eventual real backend will look like.

## Recently completed (verified against code, most recent first)

- **Dashboard redesign** (`f214667`, `c120129`, 2026-07-31 → 08-01): rebuilt from a 3-stat-tile summary into a full role-aware aggregation layer (`lib/dashboard.ts`) with 9 sections, deep-linking, collapsible density controls. See `codebase.md` § 6.
- **Crew module expansion** (`13e5427`, `33cc2af`, 2026-07-31): certifications/skills/training records, profile photo, crew-member-linking for `employee`-role users. Frontend/mock-layer only — `Employee` in the real API has none of these fields.
- **Locations/Customers/Work Types pass** (`adc107b`, 2026-07-31): richer field sets (industry, billing terms, site contacts, operational settings). Same frontend/mock-layer-only caveat.
- **3PL Intelligence chat feature** (`63e43c8`, `a1cfa74`, `ca9ba80`, `875f55c`, 2026-07-27 → 07-30): full AI-chat-workspace UI, entirely demo/mocked (no real LLM integration, no backend route). Flagship-styled entry point in the Sidebar.
- **Billing/Invoices** (`76c6668`, `d77ebf1`, 2026-07-27 → 07-28): in-memory invoice store, PDF generation. No backend ever built for this.
- **Payroll** (`f391c82`, 2026-07-23): frozen-snapshot-based payroll calculation. No backend.
- This documentation restructure (2026-08-01): replaced the old frontend-only `codebase.md` with `docs/codebase.md` + `docs/api-map.md` + `docs/business-rules.md` + `docs/map.md` + this file, after verifying the real `api/` implementation directly (routes, Prisma schema, TypeBox schemas) rather than trusting prior docs or `PLAN.md`.

## Known issues / gaps (see `codebase.md` § 2 and `api-map.md` for full detail)

- **`api/` and `web/` implement two different domain models that share type names.** Most Load-lifecycle, crew-clock, attachment, user-update, and invoice/payroll endpoints the web UI calls **do not exist** on the real backend. This is invisible in normal dev work because of the automatic dev-mode mock-layer bypass.
- **`Role` mismatch**: real `SystemUser.role` enum is `admin | lead` only; `web/`'s `Role` type and `UserForm` still offer `manager/finance/customer/employee`, none of which can actually authenticate against Postgres today.
- **`ProductType` rate model mismatch**: real API still uses tiered `RateLine[]`; `web/` posts a flat pay-type/rate shape that TypeBox silently drops, meaning real `ProductType`s created via the dashboard end up with no rate lines and bill nothing.
- **`PLAN.md`** (repo root) is stale — its "Progress" header is dated 2026-07-16, before most of the work above. Useful for original client-decision context (e.g. "Roles: Admin + Lead only" is a locked decision that `web/`'s 6-role UI has since drifted from) but not a reliable status source.

## Rejected / superseded approaches — don't resurrect

- **Frontend `calculateLoadAmounts()` / tiered `RateLine[]` billing** (`web/src/lib/billing.ts`) — replaced by `computeLoadFinancials()`/snapshot-based billing on the frontend; the old function has zero live callers per its own code comment. Don't extend it; it only still exists because the (unrelated) real-API `api/src/lib/billing.ts` still uses the tiered-rate-card concept server-side.
- **`StampBadge`** for Load status — superseded by `StatusPill`/`LoadStatusPill` (7 states don't fit `StampBadge`'s fixed 2-tone config). `StampBadge` is still used elsewhere in the app; don't extend it for new status UI.

## Product decisions

- **Frontend-first, demo-driven, backend intentionally deferred** (user, 2026-08-01): `web/` is being built and polished against mock data specifically to demo to potential clients/partners before the backend is committed to. **Why:** DB/backend tech stack is not yet decided. **How to apply:** don't push back on frontend features "needing" a real backend first — that's the intended order here. Do flag, when relevant, that a feature is demo-only until a backend exists.
- **`api/`'s current stack (Fastify + Prisma + PostgreSQL) is not a locked decision** — it may be replaced or heavily reworked once the backend tech choice is made. Don't over-invest in reconciling `api/`'s schema with `web/`'s model speculatively; that reconciliation work should wait for the real tech decision.

## Open questions (need human input, not something to guess at)

- **Is "3PL Intelligence" meant to become a real feature (real LLM backend) or is it a UI prototype/pitch piece?** Nothing in the repo indicates a backend integration is planned. Possibly answered by the same "demo-first" decision above, but not confirmed explicitly — ask if it becomes relevant.

## Files worth opening first for common task types

- Touching Load lifecycle/crew/financials → `web/src/lib/load-*.ts` (mock-layer truth) + `business-rules.md`, and `api/src/routes/loads/index.ts` + `api-map.md` if the real backend is actually in scope.
- Adding a dashboard metric → `web/src/lib/dashboard.ts` only; components stay presentational.
- Touching any entity's real API shape → `api/src/schemas/domain.ts` (TypeBox, source of truth for what the API accepts) before `api/prisma/schema.prisma` (DB shape) before `web/src/lib/types.ts` (frontend shape) — the three are hand-mirrored and currently out of sync; know which one you're actually changing.

## Latest session handoff

**Requested:** Build a documentation/memory system (this restructure) so future sessions need less repo scanning.

**Completed:** Verified the existing root `codebase.md` (web-only, mock-layer-only) against the actual `api/` implementation by reading Prisma schema, TypeBox schemas, and every route file directly. Found and documented a significant, previously-undocumented gap between `web/`'s domain model and `api/`'s real implementation. Replaced the single stale `codebase.md` with a `docs/` set: `codebase.md` (architecture reference, both apps), `api-map.md` (verified endpoint-by-endpoint inventory with web-call cross-check), `business-rules.md` (Load/payroll/billing logic, mock vs. real labeled throughout), `map.md` (file/module navigation by domain), and this file. Added a "Start Here" section to `AGENTS.md` (the canonical instruction file `.claude/CLAUDE.md` imports) pointing future sessions at this structure.

**Files changed:** `docs/codebase.md`, `docs/api-map.md`, `docs/business-rules.md`, `docs/map.md`, `docs/memory.md` (all new); `AGENTS.md` (new top section); root `codebase.md` removed (content migrated, not lost).

**Decisions made:** Used a `docs/` directory rather than scattering files at root, since this is a multi-file structure and the repo had no existing `docs/` convention to preserve. Left `PLAN.md` and `api/README.md`/`web/README.md` untouched — they're pre-existing and `api/README.md`'s endpoint table was independently verified as accurate.

**Checks performed:** Every path referenced in the new docs was confirmed to exist; every API route claim was confirmed by reading the route file's `fastify.get/post/patch/put` calls directly, not inferred; the mock-vs-real gap claims were spot-checked against `web/src/lib/store.tsx`'s actual `api.*()` call sites and `web/src/lib/api/client.ts`'s mock-first interception logic.

**Remaining risk / assumptions:** `threeplmobileapp` (the separate mobile repo) could not be inspected — anything said about it here or in `codebase.md` is sourced from `PLAN.md` only and is unverified. The exact runtime behavior of TypeBox "extra fields silently dropped" was reasoned from TypeBox's default non-strict object behavior, not tested by running the API.

**Best next action:** No code changes are needed as a result of this task. If the user's next request is a feature that touches the real API, start by reading `api-map.md` for that domain before writing code.
