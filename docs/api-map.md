# api-map.md — Verified API surface vs. what `web/` calls

> Every route below was confirmed by reading the route file directly (not inferred from `api/README.md`, though it agrees). "Web calls?" reflects what `web/src/lib/store.tsx` / `web/src/lib/api/client.ts` actually send when **not** running through the mock layer (i.e. what happens on a real, non-dev-bypass login). See [`codebase.md`](codebase.md) § 2 for why this gap exists and is usually invisible in dev.
>
> Read this before wiring any `web/` feature to "the real API," and before assuming an endpoint exists because a similar one does.

All routes are mounted under `/api/v1` except `/health` and `/` (service info). Auth: 🔓 none · 🔑 `authenticate` (either realm) · 👤 `requireSystemUser` (dashboard) · 🚚 `requireLead` (mobile).

## Auth

| Method | Path | Auth | Web calls it? |
| --- | --- | --- | --- |
| POST | `/auth/login` | 🔓 | ✅ `auth.tsx` login() |

## Locations (`api/src/routes/locations/index.ts`)

| Method | Path | Auth | Web calls it? |
| --- | --- | --- | --- |
| GET | `/locations` | 🔑 | ✅ |
| GET | `/locations/:locationId` | 🔑 | not directly (list is fetched, detail not used) |
| POST | `/locations` | 👤 | ✅ `addLocation` |
| PATCH | `/locations/:locationId` | 👤 | ✅ `updateLocation` |
| GET | `/locations/:locationId/bootstrap` | 🔑 (+ Lead assignment check) | ❌ mobile-app-only, not called from `web/` |
| POST | `/locations/:id/toggle-archive` | — | ❌ **does not exist** — `store.tsx`'s `toggleLocationArchive` calls this and will 404 against the real API |

## Customers (`api/src/routes/customers/index.ts`)

| Method | Path | Auth | Web calls it? |
| --- | --- | --- | --- |
| GET | `/customers` | 👤 | ✅ |
| GET | `/customers/:id` | 👤 | not directly |
| POST | `/customers` | 👤 | ✅ (sends `industry`/`website`/`taxId`/etc. — **not in `CustomerCreateSchema`**, silently dropped by TypeBox, not errored) |
| PATCH | `/customers/:id` | 👤 | ✅ (same extra-fields caveat) |
| POST | `/customers/:id/toggle-archive` | 👤 | ✅ works |

## Employees (`api/src/routes/employees/index.ts`) — "Crew" in the UI

| Method | Path | Auth | Web calls it? |
| --- | --- | --- | --- |
| GET | `/employees` | 👤 | ✅ |
| GET | `/employees/:id` | 👤 | not directly |
| POST | `/employees` | 👤 | ✅ (sends `employeeId`/`payType`/`skillIds`/`certifications`/`trainingRecords`/etc. — **none of these exist in `EmployeeCreateSchema`**; silently dropped) |
| PATCH | `/employees/:id` | 👤 | ✅ (same caveat) |
| POST | `/employees/:id/toggle-archive` | 👤 | ✅ works |

## Product Types (`api/src/routes/product-types/index.ts`) — "Work Types" in the UI

| Method | Path | Auth | Web calls it? |
| --- | --- | --- | --- |
| GET | `/product-types` | 👤 | ✅ |
| GET | `/product-types/:id` | 👤 | not directly |
| POST | `/product-types` | 👤 | ✅ (sends `employeePayType`/`employeePayRate`/`customerBillingType`/`customerBillingRate`/`unitOfMeasure` — **not in the real schema**, which still expects `RateLine[]`; silently dropped, so real `ProductType`s are created with no rate lines and never bill anything) |
| PATCH | `/product-types/:id` | 👤 | ✅ (same caveat) |
| POST | `/product-types/:id/toggle-archive` | 👤 | ✅ works |

## Loads (`api/src/routes/loads/index.ts`)

| Method | Path | Auth | Web calls it? |
| --- | --- | --- | --- |
| GET | `/loads` | 👤 | ✅ |
| GET | `/loads/:id` | 👤 | not directly (list + inline detail from list data) |
| POST | `/loads` | 👤 | ✅ (sends `scheduledDate`/`operationalNotes`/`palletCount`/etc. and an `assignments` shape with `status`/`clockIn`/`breaks`/etc. — real schema's `LoadCreateSchema` only knows the flat old fields + `assignments: { employeeId, clockIn, clockOut }[]`; extras silently dropped) |
| PATCH | `/loads/:id` | 👤 | ✅ (same caveat; also real API replaces the entire `assignments` array on any update that includes one — `deleteMany` + recreate, no per-assignment PATCH) |
| POST | `/loads/:id/void` | 👤 | ❌ not called (web's closest equivalent is `cancelLoad` → `/loads/:id/cancel`, which doesn't exist) |
| POST | `/loads/:id/archive` | 👤 | ❌ not called |
| POST | `/loads/:id/pause` | — | ❌ **does not exist** |
| POST | `/loads/:id/resume` | — | ❌ **does not exist** |
| POST | `/loads/:id/complete` | — | ❌ **does not exist** (real equivalent: PATCH with `status: "complete"`, which also triggers real billing calc) |
| POST | `/loads/:id/reopen` | — | ❌ **does not exist** |
| POST | `/loads/:id/close` | — | ❌ **does not exist** — no concept of "closed" in the real `LoadStatus` enum |
| POST | `/loads/:id/cancel` | — | ❌ **does not exist** — real equivalent is `/loads/:id/void` |
| POST | `/loads/:id/assignments` | — | ❌ **does not exist** as a sub-resource; real API only accepts the full `assignments[]` array inside create/update |
| POST | `/loads/:id/assignments/:aid/clock-in` \| `break-start` \| `break-end` \| `clock-out` \| `remove` | — | ❌ **none exist** |
| GET/POST | `/loads/:id/attachments`, `/loads/:id/attachments/:aid/toggle-archive` | — | ❌ **none exist** — attachments are 100% mock-layer |

## Users (`api/src/routes/users/index.ts`)

| Method | Path | Auth | Web calls it? |
| --- | --- | --- | --- |
| GET | `/users` | 👤 | ✅ |
| POST | `/users` | 👤 | ✅ (sends `role` values `manager/finance/customer/employee` — real `Role` enum is `admin \| lead` only; Prisma will reject at the DB enum level) |
| PATCH | `/users/:id` | — | ❌ **does not exist** — `store.tsx`'s `updateUser` will 404 |
| POST | `/users/:id/toggle-archive` | — | ❌ **does not exist** — `toggleUserArchive` will 404 |

## Leads admin (`api/src/routes/leads/index.ts`) — manages mobile-app Lead accounts, no web UI consumes this

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/leads` | 👤 |
| GET | `/leads/:id` | 👤 |
| POST | `/leads` | 👤 |
| PATCH | `/leads/:id` | 👤 |
| PUT | `/leads/:id/assignments` | 👤 |

Exists and is fully implemented, but nothing in `web/`'s Sidebar or pages links to it. If a future task is "let admins manage Lead field-app accounts from the dashboard," the backend is already there — only the `web/` UI is missing.

## Lead mobile-app realm (all under `/lead/*` or top-level `/locations/:id/bootstrap`)

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/lead/auth/login` | 🔓 |
| POST | `/lead/auth/refresh` | 🔓 (refresh token in body) |
| POST | `/lead/auth/logout` | 🚚 |
| GET | `/lead/session` | 🚚 |
| GET | `/lead/locations` | 🚚 |
| POST | `/lead/locations` | 🚚 — Lead self-assigns/requests a new location |
| POST | `/lead/check-ins` | 🚚 |
| POST | `/lead/check-ins/:checkInId/checkout` | 🚚 |

Not consumed by `web/` at all (`web/` is the SystemUser realm only). Relevant only if working on `api/` for the separate mobile app repo.

## Not present anywhere in `api/`

- Invoices (any route)
- Payroll (any route)
- Load attachments (any route)
- Load lifecycle sub-actions beyond `void`/`archive` (pause/resume/complete/reopen/close/cancel)
- Crew clock-in/break/clock-out/remove sub-actions
- `PATCH`/archive-toggle on `/users`
- Archive-toggle on `/locations`

If a task requires any of the above against a real backend, it is new backend work, not a wiring task — say so rather than assuming a route exists.
