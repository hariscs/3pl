# 3PL Platform — Cross-App Integration & Feature Plan

> **Progress (2026-07-16):** Phase 0 ✅ done (realm gating + Role audit; 0a key rotation still TODO). Phase 1 partial — email login ✅ committed, refresh tokens 🔨 in progress (uncommitted, migration not run), all mobile work not started. Phases 2–5 ⬜ not started. **~1.5 of 6 phases.**

Covers three codebases:

- **API** (`api/`) — Fastify backend with two auth realms: SystemUser (dashboard) and Lead (mobile field app).
- **Web** (`web/`) — Next.js dashboard, consumes the SystemUser side. Fairly complete.
- **Mobile** (`threeplmobileapp/`) — React Native Lead field app. Almost entirely mock data; only a mock `/auth/login` is wired, and there is no real HTTP adapter.

## Product vision (client meeting, `new.txt`)

> Warehouse staffing companies lose time and money because field operations, payroll, and customer billing are disconnected and managed manually. We capture operational work **once**, then automatically power everything that depends on it.

This is not a clock-in app or a payroll app — it is an operational-capture engine. Each captured artifact fans out:

| Captured once         | Powers               |
| --------------------- | -------------------- |
| Employee (crew) hours | Payroll              |
| Container data        | Customer billing     |
| Live load progress    | Operations dashboard |
| Crew assignments      | Productivity reports |
| Historical loads      | Business analytics   |

This guides prioritization: **Phase 3 (capture loads + crew hours) is the core**, and reporting/analytics (Phase 5) are the payoff.

## Decisions (locked)

1. **Refresh tokens — YES.** Add real refresh-token support to the Lead realm (refresh endpoint + rotation + storage). Mobile keeps its `accessToken` + `refreshToken` model.
2. **Lead login by email.** Migrate `Lead` from `loginId` to email-based login (schema + seed + endpoint + mobile form).
3. **Add `Load.leadId`.** Loads are attributed to the Lead who created them (migration).
4. **Notifications + Report-an-issue are in scope now** (real models + endpoints, Phase 4).

## Client-requested changes (`new.txt`, line 1)

- **Terminology: "Employee" → "Crew"** everywhere user-facing (confirmed). "Crew" is the user-facing term across web + mobile. **Internal Prisma model stays `Employee`** (relabel UI + API summaries/labels only; no data-model rename) to avoid a costly migration for zero functional gain.
- **Roles: Admin + Lead only.** The only login roles are **Admin** (dashboard) and **Lead** (mobile). Audit the `Role` enum and `register`/seed accordingly.
- **No Customer in any user flow (confirmed, all apps).** Remove the Customer selection from load creation on **mobile and web**. The Lead/admin picks a **Product Type**; the server derives `customerId` from `ProductType.customerId` and stamps it on the `Load`. `Customer` remains a **backend billing entity only** (invoicing groups by the derived customer) — never user-selectable, never a login. See Phase 3 for the flow change. Caveat: product-type names must be distinct per location so a product is unambiguous without its customer.
- **After login → select a location** (mandatory check-in gate) — Phase 1.
- **Add more locations — Leads can self-add/request location assignments** from mobile (confirmed), in addition to admin creating locations. See Phase 2.
- **Details on load click / load summary** — load detail view (mobile Phase 3; web already has `loads/[id]`).
- **Crew details** + **Lead details / signed-in user** (profile) — Phase 3 (crew) + Phase 4 (profile).
- **Report an issue** — Phase 4 (locked in scope).

---

## 0. Guiding constraints

- **Two independent apps + a separate mobile repo.** No shared code. Every cross-app shape is mirrored **by hand** in three places: `api/src/schemas/*` (TypeBox, source of truth) → `web/src/lib/types.ts` → `threeplmobileapp/src/**` types.
- **Two auth realms share one `authenticate` decorator.** It only _verifies a JWT_ — it does **not** check realm/role. Back-office routes (`/loads`, `/employees`, …) claim "system user only" but a Lead JWT currently passes. This is a security bug the plan closes.
- **Mobile is ~100% mock** except a mock login. Making it real is greenfield wiring, not refactoring.
- Delivery per repo rules: `schema → route → prisma → serializer`, thin handlers, serializers always, no raw Prisma out, TypeBox not Zod, `pnpm typecheck` (api) / `npx tsc --noEmit` (web) as gates.

---

## Current state — what the API actually exposes

| Realm                  | Endpoints                                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard (SystemUser) | `/auth/login`, `/users` (list/create), `/customers` `/employees` `/product-types` (CRUD + toggle-archive), `/loads` (list/get/create/patch/void/archive), `/locations` (list/get/download-dataset) |
| Lead (mobile)          | `/lead/auth/login`, `/lead/session` (restore), `/lead/locations` (assigned check-in cards), `/lead/check-ins` (start), `/lead/check-ins/:id/checkout`                                              |

**Web pages:** customers, employees, loads, product-types (each list/new/[id]), reports (invoice, load-entry), register, login. No Leads or Locations management.

**Mobile screens (all mock):** Dashboard, Loads, LoadsHistory, LoadSummary, ActiveLoad, CheckIn, Crew, EmployeeProfile, Notifications, Profile, ReportIssue, More, Login, Splash, and the new-load flow (Location, CustomerProduct, ContainerDetails, AssignEmployees, Review).

**Schema facts that shape the plan:**

- `LoadEmployeeAssignment` **already has** `clockIn` (required) / `clockOut` (optional) — crew time-tracking is modeled but not exposed.
- `Load` has **no `leadId`** — loads cannot be attributed to a Lead today, only to a location.
- `Lead` logs in with `loginId` (unique) + `passwordHash`, `role` defaults to `"Lead Supervisor"`, and has **no email**.
- `LeadAssignment` links lead↔location with `role`, `shiftStart`, `shiftEnd`, `distanceMiles`.
- The API has **no refresh token** concept; the auth plugin intentionally issues long-lived tokens.

---

## Phase 0 — Foundations (secrets + role gating)

**0a. Rotate & remove leaked keys.** ⬜ **TODO.** `threeplmobileapp/.env` contains `ANTHROPIC_API_KEY` / `DEEPSEEK_API_KEY`. Confirm git-tracking, rotate the keys, purge from history, add to `.gitignore`. Replace with only what mobile needs (`API_BASE_URL`).

**0b. Realm gating in the API (security fix, unblocks everything).** ✅ **DONE** (`3b39e9c`) — `realm: 'lead' | 'system'` claim on both payloads; `requireSystemUser` / `requireLead` decorators applied across all back-office routes and `/lead/*`. Also: `Role` enum reduced to `admin` + `lead` (`61de888`, migration). Add two preHandlers alongside `authenticate`:

- `requireSystemUser` — 403 unless the JWT is a SystemUser payload.
- `requireLead` — 403 unless it's a Lead payload.

Discriminate by a claim. Today both payloads carry `sub/name/role` and are indistinguishable. **Add a `realm: 'lead' | 'system'` claim** to both `LeadTokenPayload` and `SystemUserTokenPayload` when signing, then branch on it. Apply `requireSystemUser` to all back-office route groups; `requireLead` to `/lead/*`.

Edge case: existing issued tokens lack `realm` — acceptable since tokens are dev/seed today; note it.

---

## Phase 1 — Mobile → real API (prove the pipe end-to-end)

> **Status:** API-side auth largely done — **1c email login ✅ committed**, **1f refresh tokens 🔨 in progress (uncommitted, migration not yet run)**. All mobile work (1a/1b/1d/1e) not started — `threeplmobileapp/` is still ~100% mock.

Goal: delete the mock adapter path for auth, session, locations, and check-in; drive them against real `/lead/*` endpoints.

**1a. Real HTTP adapter.** ⬜ **TODO (mobile).** New `FetchNetworkAdapter implements NetworkAdapter` using `fetch`, reading base URL from `API_BASE_URL` (via `react-native-config` or a small `src/config.ts`). Map non-2xx into the existing `ApiClientError` / `NetworkError`. Switch `appDependencies.createNetworkAdapter()` to it (keep `MockNetworkAdapter` behind an env flag for offline dev).

**1b. Bearer-token injection.** ⬜ **TODO (mobile).** The adapter needs the current access token. Cleanest: give the adapter a `getToken: () => string | null` provided by the auth layer, and set `Authorization: Bearer <token>` when present. Requires exposing the token from `AuthContext` (today it's stored but private).

**1c. Reconcile the auth contract.** ✅ **DONE (API side)** (`dd4aea4`) — `Lead` migrated to email login (migration `20260714134049_lead_email_login`); login endpoint reshaped to `{ user, accessToken, refreshToken, activeCheckIn }`. Mobile-side contract update still pending (part of 1a/1c mobile). Both sides move toward the locked decisions (email login + refresh tokens):

| Concern     | Mobile assumes                                               | API today                          | Resolution                                                                                          |
| ----------- | ------------------------------------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| Path        | `/auth/login`                                                | `/lead/auth/login`                 | Update `authDataSourceImpl` to `/lead/auth/login`                                                   |
| Credentials | `email`, `password`                                          | `loginId`, `password`              | **Migrate `Lead` to email** (Decision 2): add `email @unique`, log in with email                    |
| Response    | `{user:{id,fullName,email,role}, accessToken, refreshToken}` | `{token, lead:{…}, activeCheckIn}` | Reshape API response to `{user:{id,fullName,email,role}, accessToken, refreshToken, activeCheckIn}` |
| Refresh     | expects refresh flow                                         | none                               | **Add refresh tokens** (Decision 1) — see 1f                                                        |

`User.role` on mobile is the literal `'lead'`; API returns `'Lead Supervisor'`. Widen the mobile type to `string`.

**1f. Refresh-token support (Lead realm).** 🔨 **IN PROGRESS (API, uncommitted).** Added: `RefreshToken` model in `schema.prisma`, `JWT_ACCESS_EXPIRES_IN`/`JWT_REFRESH_EXPIRES_IN` in `env.ts`, `lib/leadAuth.ts` (`issueTokens`/`rotateRefreshToken` single-use rotation/`revokeRefreshToken`), and `POST /lead/auth/refresh` + `POST /lead/auth/logout` routes. **Remaining:** run the Prisma migration for `RefreshToken`, `pnpm typecheck`, commit; mobile retry-on-401 wiring still pending. Add a `RefreshToken` model (or store a hashed rotating token per session), `POST /lead/auth/refresh` (exchange refresh → new access + rotated refresh) and `POST /lead/auth/logout` (revoke). Short-lived access token, long-lived refresh. Mobile: adapter retries a 401 once via refresh, then hard-logs-out on failure. Persist both tokens in the existing session storage.

**1d. Session restore.** ⬜ **TODO (mobile).** Replace mobile's AsyncStorage-only restore with a call to `GET /lead/session` on launch (falls back to stored token for offline). This also returns `activeCheckIn`, unifying auth + check-in restore.

**1e. Wire check-in to the server.** ⬜ **TODO (mobile).** `CheckInContext` becomes API-backed:

- Load assigned locations from `GET /lead/locations` (replaces the hardcoded `locations` array in `CheckInScreen`). Reconcile `LocationData {id,name,customer,address}` with the API's location-card `{id,name,code,group,address{…},fullAddress,distanceMiles,lastVisitedAt,status}`.
- Check-in → `POST /lead/check-ins`; check-out → `POST /lead/check-ins/:id/checkout`. Keep AsyncStorage as an offline cache, server as source of truth.
- Edge cases the API already enforces: not-assigned → 403; existing active check-in → 409. Surface both in UI.

**Deliverable:** a Lead can log in, restore session, see real assigned locations, and check in/out against Postgres. No load features yet.

---

## Phase 2 — Leads & Locations administration (API + Web) — ⬜ NOT STARTED

The blocking product hole: **no way to create a Lead or assign locations** except the seed script. Mobile is unusable for a new hire until this exists.

**API — new/extended endpoints (SystemUser-gated):**

- `Leads`: `GET /leads`, `GET /leads/:id`, `POST /leads` (name, loginId, password→hash, role), `PATCH /leads/:id`, plus assignment management: `PUT /leads/:id/assignments` (set the lead's `LeadAssignment` rows: locationId, role, shiftStart/End, distanceMiles).
- `Locations`: extend the existing read-only routes with `POST /locations`, `PATCH /locations/:id` (name, region, address block, shift window, status).
- **Lead self-add location** (confirmed): `POST /lead/locations` (or `POST /lead/assignments`, `requireLead`) so a Lead can add/request a `LeadAssignment` to a location from mobile. Decide whether it auto-assigns or creates a pending request needing admin approval — recommend auto-assign for v1, with an admin view of who's assigned where.
- New schemas in `api/src/schemas/` (`lead.ts`, extend `location.ts`), new `lib/leadSerializers.ts`. Never leak `passwordHash`.

**Web — new dashboard pages** (mirror the existing customers/employees CRUD pattern, reuse `components/ui/*`, TanStack Query via `lib/store.tsx`):

- `/(app)/leads` (list) + `/leads/new` + `/leads/[id]` (edit + location-assignment UI).
- `/(app)/locations` (list) + `/locations/new` + `/locations/[id]`.
- Mirror types into `web/src/lib/types.ts`; add to the sidebar nav.

**Optional companion:** `/(app)/check-ins` — read-only board of who's on shift where (add `GET /check-ins` for SystemUsers).

---

## Phase 3 — Lead load lifecycle (API + Mobile) — ⬜ NOT STARTED

Make the mobile new-load / active-load / history flow real. Largest phase.

**Data-model change (Decision 3 — locked, needs a migration):** add `Load.leadId String?` + relation, and a `checkInId String?` link so a load belongs to a shift. This drives "my loads / my active loads" and the productivity/analytics reports in Phase 5.

**API — new `/lead/loads` route group (`requireLead`):**

- `GET /lead/loads?status=active|completed` — loads at the lead's active check-in location (and/or `leadId`).
- `POST /lead/loads` — create; reuse billing computation in `lib/billing.ts`. Body: **no `customerId`** — the server derives it from `productTypeId` (`ProductType.customerId`) and stamps it on the Load. Fields: locationId (from check-in), productTypeId, containerNumber, cases, weight, sorts, notes, `assignments[]` (employeeId + clockIn). `leadId`/`checkInId` set from the authenticated session.
- `POST /lead/loads/:id/complete` — set status, stamp completion.
- Crew clock in/out: `POST /lead/loads/:id/assignments` (add crew member, set `clockIn`) and `PATCH /lead/loads/:id/assignments/:assignmentId` (set `clockOut`). The `LoadEmployeeAssignment.clockIn/clockOut` fields already exist — just expose them.
- Supporting pickers (lead-scoped, `requireLead`), all scoped to the checked-in location: `GET /lead/product-types` (**no customer picker**), `GET /lead/crew` (employees at the location, for `CrewScreen` + `AssignEmployeesStep`). No `/lead/customers` endpoint — customers are never selected in the flow.

**Mobile — replace mocks with these calls:**

- `NewLoadContext` + steps: **drop the Customer selection** — the "Customer & Product" step (`CustomerProductStep`) becomes a **Product-only** step; customer is derived server-side. Real product/crew pickers; billing/payroll **estimates from real `RateLine` rate cards** instead of hardcoded `$18.5/$28.75`. Remove `selectedCustomer` from `NewLoadContext` and the `locationCatalog` customer arrays.
- `LoadsScreen` / `LoadsHistoryScreen` / `LoadSummaryScreen` / `ActiveLoadScreen`: fetch from `/lead/loads`; crew clock in/out hits the assignment endpoints; `DashboardScreen` stats from a lead summary.
- Mirror all new shapes into mobile networking types.

---

## Phase 4 — Secondary mobile features (Decision 4 — in scope) — ⬜ NOT STARTED

- **Notifications**: `Notification` model + `GET /lead/notifications` + read-state (`POST /lead/notifications/:id/read`). Back `NotificationsScreen`.
- **Report an issue**: `Issue` model + `POST /lead/issues`, plus a web triage page (`/(app)/issues`) for admins. Back `ReportIssueScreen`.
- **Profile / signed-in user** (client: "lead details / signed-in user"): back `ProfileScreen` with the real lead from `/lead/session`; `EmployeeProfileScreen` → **crew** detail from `GET /lead/employees/:id`. Biometrics stays device-local.

---

## Phase 5 — Reporting & analytics (the vision payoff) — ⬜ NOT STARTED

Each capture from Phase 3 fans out into an output. Most extend the existing `web/` reports; some are new endpoints reading the captured data.

- **Payroll** (employee/crew hours): sum `LoadEmployeeAssignment` clock in/out × `Employee.hourlyRate`. Extend/replace the existing pay report.
- **Customer billing** (container data): already exists (`reports/invoice`, `lib/billing.ts`); ensure lead-captured loads feed it.
- **Operations dashboard** (live load progress): real-time board of active loads/check-ins per location — new `GET /loads?status=active` view + a dashboard widget.
- **Productivity reports** (crew assignments): per-crew throughput (cases/hours) from assignments + loads.
- **Business analytics** (historical loads): trends over time — volume, billing vs payout margin, per-location/customer.

All SystemUser-gated, mirror shapes into `web/src/lib/types.ts`.

---

## Recommended sequence & rationale

1. **Phase 0** ✅ (secrets + realm gating + Role audit + Employee→Crew relabel) — realm gating + Role audit done; 0a key rotation + Crew relabel still outstanding.
2. **Phase 1** 🔨 (mobile→API auth/check-in, email login, refresh tokens) — email login done, refresh tokens in progress; mobile wiring not started.
3. **Phase 2** ⬜ (Leads/Locations admin) — removes the "can't onboard a mobile user" blocker; pure extension of an existing web pattern.
4. **Phase 3** ⬜ (lead loads + crew clock, `Load.leadId`) — the core capture engine; depends on 0–2 and migrations.
5. **Phase 4** ⬜ (notifications, issues, profile/crew detail) — completes the mobile surface.
6. **Phase 5** ⬜ (reporting & analytics) — the vision payoff; depends on Phase 3 capture data.

---

## Resolved decisions (round 2)

1. **No Customer in any user flow, all apps** — removed from load creation on web + mobile; `customerId` derived from `productTypeId` server-side; `Customer` stays a backend billing entity only.
2. **Crew confirmed** — user-facing term is "Crew"; internal `Employee` model unchanged (UI/label relabel only).
3. **New-load customer selection** — dropped; Lead picks Product Type, customer derived. (See Phase 3.)
4. **Lead can self-add location assignments** from mobile (auto-assign for v1 recommended).

## Remaining minor questions (non-blocking)

- **Lead self-add locations**: auto-assign vs. admin-approval workflow? (Recommend auto-assign v1.)
- **Product-type name uniqueness per location**: enforce a DB constraint, or leave to admin discipline? (Recommend soft — just a note — for v1.)
