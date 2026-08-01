# business-rules.md — Load, Payroll, Billing business logic

> Every rule below is labeled **[mock]** (implemented only in `web/src/lib/mock-handlers.ts` + the `web/src/lib/load-*.ts`/`payroll.ts`/`billing.ts` helpers, exercised in normal dev use) or **[real API]** (implemented in `api/src/routes/loads/index.ts` + `api/src/lib/billing.ts`, exercised only on a real login). See [`codebase.md`](codebase.md) § 2 and [`api-map.md`](api-map.md) before assuming a mock-layer rule applies to the real backend — in most cases it doesn't, because the real backend doesn't have the concept at all yet.

## Load status lifecycle

**[mock]** 7 states (`web/src/lib/types.ts`): `draft → scheduled → in_progress → paused → completed → closed | cancelled`.
- Editable statuses: `draft`, `scheduled`, `in_progress`, `paused`, `completed` (`EDITABLE_LOAD_STATUSES`).
- `closed`/`cancelled` are read-only, terminal. `closed` is what Payroll/Billing/Invoices consume — there is no separate "archive" state.
- The first crew clock-in on a `draft`/`scheduled` load auto-flips it to `in_progress`.
- Transitions enforced both client-side (`HEADER_ACTIONS` allow-list in `loads/[id]/page.tsx`, an explicit per-status map, not a ternary) and server-side by the mock handler, which 409s with `LOAD_NOT_EDITABLE` on a locked load.
- `complete` is readiness-gated — see "Completion readiness gate" below; a blocked transition 409s with `LOAD_NOT_READY` + an `issues[]` list.

**[real API]** 4 states (`api/prisma/schema.prisma` `LoadStatus` enum): `active | complete | void | archived`. No `draft`/`scheduled`/`paused`/`closed`/`cancelled` concept. `void` (`POST /loads/:id/void`) zeros billing; `archive` (`POST /loads/:id/archive`) just flips status. Nothing else is gated — any `PATCH` can move `status` freely between the 4 values.

## Completion readiness gate

**[mock]** `getLoadReadiness()` (`web/src/lib/load-readiness.ts`) — wired into the mock `completeLoad` handler. Returns `ready | review(issues[]) | cancelled`. **Blockers** (reject the transition): crew still `clocked_in`/`on_break`, all production quantities zero (cases/sorts/weight/pallets/pieces), missing Work Type. **Warnings** (shown but don't block): no crew assigned, missing container/trailer number, no PO number, zero billed/payout amount, missing door number.

**[real API]** No readiness concept — `complete` is just one of 4 enum values settable via `PATCH`.

## Crew assignment lifecycle

**[mock]** `LoadCrewAssignment.status`: `assigned → clocked_in → on_break → clocked_out`, or `removed` (never hard-deleted). Removing a crew member auto-closes any open break and clocks them out first, preserving worked-time history. Breaks nest inside their owning assignment (`assignment.breaks[]`), not a flat top-level collection. `web/src/lib/load-time.ts` derives worked minutes (clock-out − clock-in − completed breaks) and guards the sequence: no clock-out while on an open break, no double breaks, etc. — enforced identically client-side and in the mock handler.

**[real API]** `LoadEmployeeAssignment` is just `{ clockIn: string, clockOut: string | null, employeeId }` — no status enum, no breaks, no assigned/removed distinction. Set wholesale via the `assignments[]` array on Load create/update (full replace on any update that includes the field — no per-assignment endpoint exists).

## Financial snapshots

**[mock]** Selecting a Work Type on an editable Load freezes its config onto `Load.paySnapshot` (`employeePayType`, `employeePayRate`, `unitOfMeasure`) and `Load.billingSnapshot` (`customerBillingType`, `customerBillingRate`, `unitOfMeasure`) — both timestamped `snapshottedAt`. Payroll and Billing always read the snapshot, never the live Work Type, so a later rate change never touches historical Loads.

`computeLoadFinancials()` (`web/src/lib/load-financials.ts`, verified) recomputes on every quantity/assignment change **pre-closure**:
- `payoutAmount` = `workedHours × employeePayRate` if `employeePayType === "hourly"`, else `getBillingQuantity(load, unit) × employeePayRate` (production).
- `billedAmount` = same formula against `billingSnapshot`.
- A `cancelled` load always zeroes both, unconditionally.
- Once `closed`, financials freeze forever (the mock handler stops recomputing).

`splitProductionPayout()` — production-type payout is split **evenly** across every non-removed assignment with worked time > 0 (`payoutAmount / contributors.length`, rounded to cents). Documented simplification: no per-worker unit attribution exists ("who packed which case"). Hourly-type pay is never split this way — `getEmployeePayroll` uses each assignment's own worked hours directly instead.

**[real API]** `calculateLoadAmounts(rateLines, qty)` (`api/src/lib/billing.ts`) computes from a `ProductType`'s tiered `RateLine[]` (`billBase`/`billThreshold`/`billOverRate`/`payThreshold`/`payOverRate`/`payBonus` per unit) — only invoked when `status` is set to `complete` (`computeBilling()` in `routes/loads/index.ts`). No snapshotting: if a `RateLine` changes after a Load completes, re-`PATCH`ing that Load with any field recomputes billing off the *current* rate lines, not a frozen value — the opposite of the mock layer's guarantee. No production-payout split logic exists — `payoutAmount` is a single number.

## Payroll calculation

**[mock only — no real API equivalent]** `getEmployeePayroll()` (`web/src/lib/payroll.ts`) reads each contributing Load's frozen `paySnapshot`, not the employee's general `hourlyRate`:
- Hourly-type loads: worked-minutes × that load's own snapshot rate.
- Production-type loads: `splitProductionPayout()`'s per-assignment share.
- **Overtime exception**: the OT premium always uses `employee.hourlyRate × 1.5` as a flat baseline — never a contributing load's own snapshot rate. Documented as a genuine open business question (which load's rate "owns" the 41st hour of a week spanning multiple snapshot rates), not a bug.

## Customer Billing → Invoice

**[mock only]** Loads eligible for billing: `status === "completed" || status === "closed"` and `billedAmount > 0`. Selecting loads → `CreateInvoiceDialog` → in-memory `POST /invoices` (`web/src/lib/invoices.ts`) → selected loads marked invoiced. No real persistence; invoice data is lost on a full reload. Invoice status only ever `"draft"` — no sent/paid/overdue lifecycle implemented despite `PLAN.md` listing it as planned.

## Crew certifications / skills / training

**[mock/frontend-only]** `web/src/lib/crew-catalogues.ts` defines fixed `id → label` reference catalogues for Skills, Certification Types, and Training Types (e.g. `forklift_operation`, `osha_safety_training`, `cold_storage_safety`) — no admin CRUD for managing the catalogues themselves, by design ("per project scope" per the file's own comment). An `Employee` stores only ids (`skillIds: string[]`, plus full `CrewCertification[]`/`CrewTrainingRecord[]` records with their own `certificationTypeId`/`trainingTypeId`); the catalogue maps id → readable label for display. Certification status (e.g. expired/expiring) is always derived from `expiresAt` (`getCertificationStatus` in `web/src/lib/crew.ts`) — never stored as its own field.

**Real API**: `Employee` has no certification/skill/training fields at all — see `api-map.md`.

## Role-based access (as implemented, `web/`)

- `admin` — full access, unrestricted.
- `manager`/`lead` — scoped via `SystemUser.locationIds`; Loads-only nav.
- `finance` — unrestricted locations, Finance-focused; Dashboard hides Operations Now/Workforce Overview.
- `customer` — scoped via `customerId`; not wired into any UI beyond the type existing.
- `employee` — linked to a Crew Member via `linkedCrewMemberId`; no desktop UI at all for this role (intended for the separate mobile app).
- Dashboard-specific: `lead` never sees the Financial Workflow section (no sensitive figures for that role); `customer`/`employee` are blocked from the Dashboard page entirely with a plain message rather than a second dashboard variant.
- **Caveat**: only `admin`/`lead` exist as real, authenticatable roles against the actual `SystemUser`/`Role` enum in Postgres (`admin | lead`) — see `codebase.md` § 5. `manager`/`finance`/`customer`/`employee` accounts can be created through the mock layer and the `UserForm` UI, but cannot log in against the real API.

## Status labeled "implemented" vs "planned" (cross-check before trusting a UI affordance)

| Behavior | Status |
| --- | --- |
| Load 7-state lifecycle, readiness gate, crew clock/break tracking, financial snapshots | Implemented — **mock layer only** |
| Real-API load lifecycle (create/update/void/archive), tiered rate-card billing on `complete` | Implemented — real API, 4-state model, no snapshotting |
| Payroll calculation, PDF export | Implemented — **mock layer only**, no backend |
| Customer Billing → Invoice creation | Implemented — **mock layer only**, no backend, session-only |
| Invoice email/send, invoice status lifecycle (sent/paid/overdue) | Planned only (`PLAN.md`) — not implemented anywhere |
| Load attachments (photo/video/document) | Implemented — **mock layer only**, `URL.createObjectURL`, session-only, no backend route |
| Crew certifications/skills/training | Implemented — **mock layer + frontend types only**, no backend fields |
| 3PL Intelligence (AI chat) | UI implemented, responses are **entirely mocked/demo** (`metadata.demo: true`), no real LLM call, no backend route |
| Company settings page, customer portal | Planned only — not implemented |
| Pagination, mobile responsiveness, automated tests, error boundaries | Not implemented anywhere |
