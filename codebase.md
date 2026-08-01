# codebase.md — Dockmaster 3PL Operations Platform (Web Frontend)

> **Updated:** 2026-08-01
> **Scope:** `web/` — the Next.js dashboard frontend, a frontend-only app against an in-memory mock API layer. The `api/` Fastify backend is referenced but not touched by this app's mock layer.

---

## 1. Project Overview

**Application name:** Dockmaster (package name `3plwork`, public-facing "3PL Work").

**Business purpose:** A 3PL dock-operations admin portal for warehouse staffing companies. `Load` is the central operational record connecting Customer → Location → Work Type → Crew Assignments → Time/Breaks → Payroll/Billing/Invoices. A separate native mobile app (outside this repo) is the field/check-in client — this repo's Load domain model (stable IDs, shared attachment repository, crew clock-in/break states) is built to be that mobile app's eventual data contract, but no mobile UI is built here.

**Users and roles** (`Role` in `lib/types.ts`):
| Role       | Access |
| ---------- | ------ |
| `admin`    | Full access — Setup, Loads, Reports, Finance |
| `manager`  | Location-scoped (via `SystemUser.locationIds`) — Loads only |
| `lead`     | Location-scoped — Loads only, can be a Load supervisor |
| `finance`  | Location-unrestricted — intended for Finance/Payroll/Billing surfaces |
| `customer` | Scoped via `customerId`, not yet wired into the UI |
| `employee` | Linked to a Crew Member via `linkedCrewMemberId`; no desktop access is built for this role in this repo (handled by the separate mobile app) |

**Major workflows:**
- Login → Dashboard
- Load creation (draft) → Crew assignment → Clock-in/break/clock-out → Complete → Close → Payroll/Billing/Invoices
- Customer Billing → Select completed/closed loads → Create Invoice
- Invoice List → View/Preview/Download/Print Invoice PDF
- Payroll → Period-based crew pay reports, computed from each Load's frozen pay snapshot → PDF Export
- Load Report → Historical operational view
- Master data CRUD (customers, crew, locations, work types, users)

---

## 2. Technology Stack

| Technology | Version | Where used |
| ---------- | ------- | ---------- |
| Next.js | 16.2.10 | App framework (app router) |
| React | 19.2.4 | UI components |
| TypeScript | ^5 | All source code |
| Tailwind CSS | v4 | Styling |
| TanStack React Query | ^5.101.2 | Server-state management |
| Recharts | ^3.9.2 | Dashboard charts |
| Lucide React | ^1.25.0 | Icons |
| Sonner | ^2.0.7 | Toast notifications |
| Biome | 2.2.0 | Linting + formatting |
| @react-pdf/renderer | (existing) | PDF generation |
| pnpm | — | Package manager |

---

## 3. Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── (app)/                  # Authenticated shell
│   │   │   ├── layout.tsx          # Auth guard + Sidebar + AppDataProvider
│   │   │   ├── page.tsx            # Dashboard
│   │   │   ├── crew/               # Crew (Employees)
│   │   │   ├── customers/          # Customers
│   │   │   ├── finance/
│   │   │   │   ├── customer-billing/
│   │   │   │   ├── invoices/
│   │   │   │   │   ├── page.tsx    # Invoice list
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx # Invoice detail + PDF
│   │   │   │   └── payroll/        # Payroll list + detail
│   │   │   ├── loads/              # Load list, new, detail
│   │   │   ├── locations/          # Locations
│   │   │   ├── product-types/       # Work Types (route/internal name kept as "product-types")
│   │   │   ├── register/           # User registration
│   │   │   └── reports/
│   │   │       ├── load-entry/     # Load entry report
│   │   │       ├── load-report/    # Load report (historical)
│   │   │       └── invoice/        # Invoice report (legacy)
│   │   ├── login/
│   │   └── forgot-password/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── DashboardCharts.tsx
│   │   ├── FilterableTable.tsx
│   │   ├── FilterChip.tsx
│   │   ├── StampBadge.tsx          # Legacy 2-tone badge; Load status uses LoadStatusPill instead (7 states don't fit its fixed config)
│   │   ├── AdminOnly.tsx
│   │   ├── PayrollPdfDocument.tsx
│   │   ├── forms/                  # Customer/Crew/Location/ProductType/Load forms
│   │   │   └── LoadForm.tsx        # Shared create+edit form, mounted on both /loads/new and /loads/[id]
│   │   ├── loads/
│   │   │   ├── CustomerLocationWorkTypeFields.tsx  # Cascading Customer→Location→WorkType trio, shared by LoadForm
│   │   │   ├── LoadCrewPanel.tsx   # Assign/clock-in/break/clock-out/remove crew, live elapsed time
│   │   │   ├── LoadAttachmentsPanel.tsx # Upload/preview/archive photos, video, documents
│   │   │   └── LoadStatusPill.tsx  # StatusPill wrapper for the 7-state LoadStatus
│   │   ├── dashboard/
│   │   │   ├── DashboardHeader.tsx        # Title, date-range presets, Customer/Location filters, Create Load + actions menu
│   │   │   ├── OperationsNowTable.tsx     # Compact live table of in-progress/paused loads, clickable rows
│   │   │   ├── AttentionRequiredList.tsx  # Categorized, collapsible exception list
│   │   │   ├── FinancialWorkflowPanel.tsx # Payroll + Billing funnels, Gross Margin
│   │   │   ├── RankedPerformanceTable.tsx # Shared by Customer & Location Performance
│   │   │   ├── WorkforceOverview.tsx      # Who's working/on break now, capped + collapsible
│   │   │   └── RecentActivityFeed.tsx     # Deduped, capped + collapsible activity feed
│   │   ├── invoices/
│   │   │   ├── CreateInvoiceDialog.tsx
│   │   │   └── InvoicePdfDocument.tsx
│   │   ├── payroll/
│   │   │   └── RecordPaymentDialog.tsx
│   │   └── ui/                     # Primitives: Button, Card, Field, Modal, etc.
│   └── lib/
│       ├── types.ts                # All shared types
│       ├── auth.tsx                # Auth context
│       ├── token.ts                # localStorage helpers
│       ├── store.tsx               # AppData context + TanStack Query
│       ├── providers.tsx           # Root providers
│       ├── billing.ts             # Billing calculations + formatMoney
│       ├── invoices.ts            # Invoice types + store + company info
│       ├── payroll.ts             # Payroll calculations (reads each Load's frozen pay snapshot)
│       ├── csv.ts                 # CSV export utility
│       ├── mock-data.ts           # Static seed data
│       ├── mock-handlers.ts       # Dev-bypass mock API handlers (intercepts fetch)
│       ├── loads.ts               # formatLoadNumber, getBillingQuantity, supervisor-eligibility helpers
│       ├── load-time.ts           # Worked-minutes derivation from clock/break events, clock sequence guards
│       ├── load-financials.ts     # computeLoadFinancials / splitProductionPayout — the billed/payout engine
│       ├── load-readiness.ts      # Blocker/warning checks gating "Complete"
│       ├── load-attachments.ts    # In-memory attachment repository (mirrors invoices.ts's store pattern)
│       ├── use-load-attachments.ts # Per-load attachment query hook (not part of the app-boot fetch)
│       ├── dashboard.ts           # Dashboard aggregation layer — every metric/row/chart-point, scope-aware
│       ├── use-invoices.ts        # Per-need invoices query hook (Dashboard-only consumer today)
│       ├── use-payroll-records.ts # Per-need payroll-status query hook (no bulk endpoint exists, fetches in parallel)
│       └── api/
│           └── client.ts          # Typed fetch wrapper
```

---

## 4. Major Modules

### Dashboard
- **Route:** `/` (`app/(app)/page.tsx`) — a role-aware operational command center, not a static analytics page. Rebuilt from a 3-stat-tile summary into a full aggregation layer plus 9 sections; every number is derived from the same shared `loads`/`employees`/`customers`/`locations`/`productTypes`/`users` arrays the rest of the app reads (via `useAppData()`), plus `invoices` and per-employee payroll status fetched on demand — no dashboard-only hardcoded data.
- **Aggregation layer (`lib/dashboard.ts`):** the single place every metric/row/chart-point is computed. `buildScope(role, user)` produces `{ allowedLocationIds: string[] | null }` (`null` = unrestricted for admin/finance; a location list for manager/lead) — applied once via `selectScopedLoads` before anything else runs, since the mock API itself does no server-side scoping. `selectPeriodLoads` further narrows by the header's date-range preset. Every other `get*` function (`getOperationalSummary`, `getOperationsNow`, `getAttentionItems`, `getFinancialWorkflow`, `getLoadsCompletedTrend`, `getBillingVsPayrollTrend`, `getLoadStatusDistribution`, `getCustomerPerformance`, `getLocationPerformance`, `getWorkforceOverview`, `getCertificationAlerts`, `getRecentActivity`) takes already-scoped arrays and returns a typed row/summary shape consumed directly by a presentational component.
- **"Live" vs "period" sections:** Top Operational Summary, Operations Now, Attention Required, and Workforce Overview always reflect *now* and ignore the date-range filter (labeled `Live`); Financial Workflow, Performance Trends, and Customer/Location Performance respect the selected range (labeled with the range name, e.g. `Last 7 Days`). Every section carries a small badge making this explicit.
- **New data hooks:** `use-invoices.ts` and `use-payroll-records.ts` — per-need TanStack Query hooks (mirroring the existing `use-load-attachments.ts` pattern) rather than widening `AppDataProvider`'s app-boot fetch, since the Dashboard is currently the only consumer of "all invoices" and "all payroll statuses" together.
- **Role-aware sections:** `admin`/`manager`/`finance` see Financial Workflow (`lead` does not — no sensitive financial figures for that role); `finance` hides Operations Now and Workforce Overview (de-emphasizing live crew ops); `customer`/`employee` are blocked from the page entirely with a simple message (not a second dashboard app).
- **Deep-linking:** stat tiles and Attention items link into pre-filtered views of other pages — `FilterableTable` gained an optional `initialFilterValues` prop (seeds a filter chip's value on mount, additive/backward-compatible) so `/loads?status=...` and `/finance/customer-billing?billingStatus=...` land already filtered; `loads/page.tsx` and `customer-billing/page.tsx` read that query param once via `useSearchParams()`.
- **Collapsible density controls:** `Attention Required` groups each category in a native `<details>` (categories over 5 items start collapsed — a 30+ item Operations group was forcing excessive scrolling); `Workforce Overview` and `Recent Activity` show a small visible slice with the rest behind a `<details>` "N more" disclosure. `Recent Activity` also collapses each Load's lifecycle history to just its single most recent milestone (closed > completed > started > created) instead of listing every milestone as a separate row — the full history is one click away on `loads/[id]`.
- **Charts (`DashboardCharts.tsx`):** `LoadsCompletedTrendChart` (area/line), `BillingPayoutChart` (grouped bar, evolved from the old loads-per-day chart), `LoadStatusDonutChart` (new) — three total, chosen over the spec's full chart menu to stay information-dense rather than cluttered; a "Cases/Production over time" chart was deliberately not built since summing across mixed Units of Measure (case/pallet/piece/weight/container) would be misleading. `globals.css` gained `--color-chart-3`/`--color-chart-4` for the donut's extra slices.
- **`StatCard`** gained optional `icon`/`href`/`tone` props (all backward-compatible — existing plain-label callers on Payroll/Invoices pages are unaffected) and now always fills its grid cell (`h-full`) so a 5-tile row stays even height even when one tile's hint text wraps to two lines.

### Loads
- **Routes:** `/loads` (list, `FilterableTable` with a Customer picker that cascades the Location/Work Type filter options), `/loads/new` (thin `LoadForm` wrapper, always creates status `draft`), `/loads/[id]` (detail — the operational hub for a Load's entire lifecycle)
- **Status lifecycle** (`LoadStatus`, 7 states): `draft → scheduled → in_progress → paused → completed → closed | cancelled`. `draft/scheduled/in_progress/paused/completed` are editable (`EDITABLE_LOAD_STATUSES`); `closed` and `cancelled` are read-only and are what Payroll/Billing/Invoices consume. There is no separate Load "archive" — `closed` already serves as the protected terminal state. Status transitions are enforced server-side by the mock handler (409 `LOAD_NOT_EDITABLE` on a locked load) and driven client-side by an explicit per-status allow-list (`HEADER_ACTIONS` in `loads/[id]/page.tsx`) rather than a ternary, since a 7-state machine makes a 2-way ternary silently wrong for most states.
- **Load Number:** users never see the raw `id`/`ticketNumber` — `formatLoadNumber(ticketNumber)` (`lib/loads.ts`) renders it as `LD-1###` everywhere a load is referenced (list, detail, reports, invoices).
- **Crew assignments:** `LoadCrewAssignment` has its own 5-state lifecycle distinct from the Load's own status — `assigned → clocked_in → on_break → clocked_out`, or `removed` (never hard-deleted; removal auto-closes any open break and clocks the person out first, preserving worked-time history). The first clock-in on a `draft`/`scheduled` load flips it to `in_progress` automatically. Breaks nest inside their owning assignment (`LoadCrewAssignment.breaks[]`) rather than a flat top-level collection. `lib/load-time.ts` derives worked minutes (clock-out minus clock-in minus completed breaks) and guards the sequence (no clock-out while on an open break, no double breaks, etc.), enforced identically client-side and in the mock handler.
- **Financial snapshots:** selecting a Work Type on an editable Load freezes its pay/billing configuration onto `Load.paySnapshot`/`Load.billingSnapshot` — Payroll and Billing always read these, never the live Work Type, so changing a Work Type's rate later never touches historical Loads. `lib/load-financials.ts`'s `computeLoadFinancials` recomputes `billedAmount`/`payoutAmount` from the snapshot × quantity (production types) or × worked hours (hourly types) on every quantity/assignment change pre-closure, then freezes forever once `closed`. Production-type payout is split evenly across every assignment that logged worked time (`splitProductionPayout`) — a documented simplification, since there's no per-worker unit-attribution mechanism.
- **Attachments:** a shared `LoadAttachment[]` repository (`lib/load-attachments.ts`), independent of `Load` itself, with its own mock routes (list/create/toggle-archive) and its own query hook (`use-load-attachments.ts`) fetched per-load rather than joined into the app-boot parallel fetch. Photos/videos/documents are stored as `URL.createObjectURL(file)` object URLs — session-only, a known mock-layer limitation, not real cloud storage. Size limits (15MB photo / 25MB document / 100MB video) are enforced in `lib/attachments.ts`.
- **Notes & Activity Timeline:** `Load.notes[]` is a real persisted field (survives a page reload, unlike the old hardcoded per-loadId demo notes it replaced). The Activity Timeline on the detail page is derived live from real assignment/break/status timestamps (`buildLoadActivity` in `loads/[id]/page.tsx`), not hardcoded per-load demo data — it works for every Load, not just a handful of seeded examples.
- **Components:** `LoadStatusPill`, `LoadCrewPanel`, `LoadAttachmentsPanel`, `CustomerLocationWorkTypeFields`, `LoadForm`

### Master Data
- **Customers:** CRUD + archive/restore, `FilterableTable` list (search by name/code/contact/email + Status/Industry filters). A business entity (e.g. Amazon, Geodis, DHL), not an operational site — owns zero or more Locations (`Location.customerId` is the source of truth; Customer carries no `locationIds` array). Model: Basic Info (name, code, legal name, status: active/inactive/archived), Business Info (industry, website, tax ID), Primary Contact (name, title, email, phone), Billing (billing email, payment terms, notes), `createdAt`/`updatedAt`. Payment terms is a stored enum (`due_on_receipt`/`net_7`/`net_15`/`net_30`/`net_45`) with no billing logic attached yet. Only Active customers are selectable when creating a Location; the Customer edit page lists its linked Locations read-only.
- **Crew (Employees):** CRUD + archive/restore, category selection. Not permanently assigned to a Location — that's resolved later per shift via Clock-In (not built yet).
- **Locations:** CRUD + archive/restore, `FilterableTable` list (search + Customer/State/Status filters). An operational work site (warehouse, DC, customer facility, plant, job site), not just an address — every Location belongs to exactly one required Customer. Model: Basic Info (name, customer, code, region, group, status: active/inactive/archived), Address (street/city/state/zip/country), Site Contact (name/phone/email), Operational (timezone, shift window, notes), `createdAt`/`updatedAt`. Archived Locations are excluded from the TopBar's operational location switcher; archiving never hard-deletes. User location access (manager/lead scoping) lives on `SystemUser.locationIds`, independent of this domain.
- **Work Types** (internally `ProductType`, routed at `/product-types` — kept for compatibility; the UI says "Work Type" throughout): CRUD + archive/restore, `FilterableTable` list (search by name/code + Customer/Status/Unit filters). Represents the type of labor performed for a Customer (e.g. Floor Loaded Containers, Palletized Freight), not inventory — belongs to exactly one Customer, never scoped to a Location and never a global catalog (two customers may have similarly-named work types with different rates). Model: Basic Info (name, code, status: active/inactive/archived), Payroll (employee pay type hourly/production + rate), Billing (customer billing type hourly/production + rate), Operational Settings (unit of measure — a controlled list, not free text — + notes), `createdAt`/`updatedAt`. Replaced the old multi-line tiered rate-card (`RateLine[]`, base/threshold/overRate/bonus) with this flatter config — that engine (`calculateLoadAmounts` in `lib/billing.ts`) had zero live callers, so removing it was a safe cleanup, not a functional regression. Stores pay/billing configuration only; no calculation logic exists yet — that's for the future Load module, which is expected to auto-populate a Load's pay/billing/unit from the selected Work Type instead of letting a Lead enter rates manually.

### Payroll
- **Routes:** `/finance/payroll` (list), `/finance/payroll/[id]` (employee detail)
- **Features:** Pay period selector, crew pay aggregation, approve/pay workflow, PDF export via `DocumentViewer`
- **Calculation:** `getEmployeePayroll` (`lib/payroll.ts`) reads each contributing Load's frozen `paySnapshot` rather than the employee's general `hourlyRate` — hourly-type loads pay worked-minutes × that load's own snapshot rate; production-type loads use `splitProductionPayout`. The one deliberate exception: the overtime premium always uses `employee.hourlyRate × 1.5` as a documented baseline, since attributing which load's rate "owns" the 41st hour of a week spanning multiple snapshot rates is a genuine open business question, not solved here.
- **PDF:** `PayrollPdfDocument` using `@react-pdf/renderer`

### Customer Billing
- **Route:** `/finance/customer-billing`
- **Features:** Completed/closed load selection, billing status (unbilled/invoiced), Create Invoice dialog
- **Flow:** Select loads (`status === "completed" || status === "closed"`, `billedAmount > 0`) → `CreateInvoiceDialog` → POST /invoices → loads marked invoiced

### Invoices
- **Routes:** `/finance/invoices` (list), `/finance/invoices/[id]` (detail)
- **Invoice List:** `FilterableTable` with search, customer/status/date filters, summary metrics, CSV export, `ActionsMenu`
- **Invoice Detail:** Professional invoice preview (company info, bill-to, metadata, line items, totals, notes), "Preview PDF" button
- **Invoice PDF:** `InvoicePdfDocument` using `@react-pdf/renderer`, viewed via `DocumentViewer` with Download and Print support
- **Data:** Central in-memory store in `lib/invoices.ts`, mock API in `lib/mock-handlers.ts`

### Reports
- **Load Entry Report:** `/reports/load-entry` — all loads with filters + CSV
- **Load Report:** `/reports/load-report` — completed loads, 5 summary cards, `FilterableTable`, `ActionsMenu`, CSV export
- **Invoice Report:** `/reports/invoice` — legacy completed loads report

---

## 5. Shared Components

| Component | Path | Purpose |
| --------- | ---- | ------- |
| `FilterableTable` | `components/FilterableTable.tsx` | Generic filterable/sortable data table with search, filter chips, CSV export. Extended with `searchFn`, `defaultSort`, and `initialFilterValues` (pre-seeds a filter chip's value, e.g. for Dashboard deep-links) props |
| `ActionsMenu` | `components/ui/ActionsMenu.tsx` | Three-dot kebab dropdown menu |
| `StatusPill` | `components/ui/StatusPill.tsx` | Colored pill with dot (5 tones) |
| `StampBadge` | `components/StampBadge.tsx` | Outlined status badge (legacy pattern; no longer used for Load status) |
| `LoadStatusPill` | `components/loads/LoadStatusPill.tsx` | `StatusPill` wrapper mapping all 7 `LoadStatus` values to tones |
| `DocumentViewer` | `components/ui/DocumentViewer.tsx` | Full-screen PDF preview modal with Download + Print (uses `@react-pdf/renderer`) |
| `TopBar` | `components/TopBar.tsx` | Page header with title + location selector |
| `AdminOnly` | `components/AdminOnly.tsx` | Role gate wrapper |
| `Card` | `components/ui/Card.tsx` | Card container |
| `Button` | `components/ui/Button.tsx` | Button (primary/secondary/danger/ghost) |
| `StatCard` | `components/ui/StatCard.tsx` | Large-stat display card |
| `ConfirmDialog` | `components/ui/ConfirmDialog.tsx` | Confirmation modal |

---

## 6. Data Flow

1. `AuthProvider` manages auth state (login, logout, session restore)
2. `AppDataProvider` fetches all entity lists via TanStack Query (6 parallel queries)
3. Pages consume data via `useAppData()` hook
4. Mutations use `withToast()` → API call → invalidate query cache → toast
5. All filtering/sorting is client-side in `FilterableTable`
6. Invoices use a separate in-memory store (`lib/invoices.ts`) with mock API handlers
7. PDF generation uses `@react-pdf/renderer` → `pdf().toBlob()` for download/print
8. Data too specific/heavy to join into the app-boot fetch (Load attachments, Invoices, per-employee Payroll status) uses its own small `use-*.ts` TanStack Query hook, fetched on demand by the page/section that needs it
9. The Dashboard never computes metrics inline in JSX — every page-level `useMemo` calls straight into `lib/dashboard.ts`, which is the single source of truth for how each number/row is defined

---

## 7. Mock APIs

When using the dev-bypass token (no backend), `lib/mock-handlers.ts` intercepts all API calls:
- GET/POST/PATCH for all entities (locations, customers, employees, product types, loads, users), plus POST toggle-archive for locations/customers/employees/product-types/users
- Load lifecycle: `POST /loads` (create, always `draft`), `PATCH /loads/:id` (409 if closed/cancelled; re-snapshots on Work Type change; recomputes financials), `POST /loads/:id/{pause,resume,complete,reopen,close,cancel}` (each enforces its own valid source status — `complete` is readiness-gated and rejects with 409 `LOAD_NOT_READY` + an `issues[]` list if a blocker is unresolved)
- Load crew: `POST /loads/:id/assignments` (assign), `POST /loads/:id/assignments/:aid/{clock-in,break-start,break-end,clock-out,remove}`
- Load attachments: `GET/POST /loads/:id/attachments`, `POST /loads/:id/attachments/:aid/toggle-archive`
- GET/POST for invoices (in-memory store)
- GET/POST for payroll records (status overrides)
- Mutations update in-memory cloned arrays

---

## 8. PDF Infrastructure

- **Library:** `@react-pdf/renderer`
- **Documents:** `PayrollPdfDocument` (payroll report), `InvoicePdfDocument` (invoice)
- **Viewer:** `DocumentViewer` — full-screen modal with live `PDFViewer` preview, Download button, Print button
- **Download:** Generates PDF blob → `URL.createObjectURL` → programmatic `<a>` click
- **Print:** Opens PDF blob in new tab → `window.print()`

---

## 9. Reusable UI Patterns

- **List pages:** `TopBar` + `AdminOnly` + `<main className="flex-1 space-y-4 p-6">` + summary cards grid + `FilterableTable` in `Card`
- **Summary cards:** `Card` with centered label/value, `font-tick text-xl font-semibold` for numbers
- **Row menu:** `ActionsMenu` with `filterable: false, sortable: false` column, empty header
- **Table columns:** Linked IDs use `font-tick font-medium text-ink hover:text-rust`
- **Currency:** `formatMoney()` from `lib/billing.ts`
- **CSV:** `downloadCsv()` from `lib/csv.ts`
- **Status:** `StatusPill` for simple status, `StampBadge` for load statuses

---

## 10. Known Limitations

- **No pagination** — all lists display all records
- **No mobile responsiveness** — desktop-first with limited tablet breakpoints
- **No testing** — zero automated tests
- **No form validation library** — manual validation in submit handlers
- **No error boundaries** — unhandled render errors crash the app
- **Forgot password** — purely cosmetic, no API calls
- **Customer address** — not yet available; invoices show "Address not available"
- **Company info** — hardcoded constant in `lib/invoices.ts`
- **Invoice status** — only "draft" supported
- **Dual status components** — `StampBadge` (legacy, still used elsewhere) and `StatusPill`/`LoadStatusPill` (newer) coexist
- **Some lint warnings remain** — pre-existing a11y, CSS `!important`, and dependency array issues requiring deeper refactoring
- **Load attachments are session-only** — stored as `URL.createObjectURL(file)` object URLs, not uploaded anywhere; they vanish on a full page reload/browser restart, same limitation class as the rest of this app's in-memory mock data
- **Production-type payout split is an even split** across every assignment with worked time on the load — there's no per-worker unit-attribution mechanism (no "who packed which case")
- **Overtime premium uses a flat baseline rate** (`employee.hourlyRate × 1.5`), not each contributing load's own snapshot rate — attributing OT across loads with different rates in the same week is an open business question
- **No mobile UI in this repo** — the Load domain model (stable IDs, shared attachment repository, crew clock-in/break states) is designed to be consumed by a separate native mobile app, but that app is a separate codebase and out of scope here
- **Most seed Load dates are fixed, not relative to "today"** — the bulk of `mock-data.ts`'s Loads carry hardcoded 2026-06/07 dates, so the Dashboard's "Today" date-range preset will look sparse the further real time drifts from when the data was seeded (a small number of loads — `load-250`/`load-251` — were deliberately dated to the day this Dashboard task shipped so "Today"/"Last 7 Days" have something real to show; this doesn't self-maintain going forward)
- **`getOperationsNow`'s "Elapsed" column falls back to a plain date once a load's live elapsed time exceeds 24h** (`OperationsNowTable.tsx`) rather than showing an absurd hour count — a direct consequence of the fixed-seed-date limitation above, not a bug in the elapsed-time math itself

---

## 11. Future Work

- PDF generation for invoices (already wired with disabled buttons, ready to implement)
- Invoice email/send workflow
- Invoice status lifecycle (sent, paid, overdue)
- Company settings page
- Customer portal with read-only access
- Pagination for large datasets
- Mobile responsive design
- Automated testing
- Error boundaries