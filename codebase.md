# codebase.md — Dockmaster 3PL Operations Platform (Web Frontend)

> **Updated:** 2026-07-27
> **Scope:** `web/` — the Next.js dashboard frontend. The `api/` Fastify backend is referenced but not the primary subject of this document.

---

## 1. Project Overview

**Application name:** Dockmaster (package name `3plwork`, public-facing "3PL Work").

**Business purpose:** A 3PL dock-operations platform for warehouse staffing companies. Captures operational work once (loads, crew assignments, quantities), then powers payroll, customer billing, invoicing, and operational reports.

**Users and roles:**
| Role       | Access |
| ---------- | ------ |
| `admin`    | Full access — Setup, Load Entry, Loads, Reports, Finance |
| `lead`     | Load Entry + Loads only |
| `customer` | Defined in types but not yet wired into the UI |

**Major workflows:**
- Login → Dashboard
- Load entry → Crew assignment → Complete load → Billing/payout
- Customer Billing → Select completed loads → Create Invoice
- Invoice List → View/Preview/Download/Print Invoice PDF
- Payroll → Period-based crew pay reports → PDF Export
- Load Report → Historical operational view
- Master data CRUD (customers, crew, locations, product types, users)

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
│   │   │   ├── product-types/       # Product types
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
│   │   ├── StampBadge.tsx
│   │   ├── TicketStub.tsx
│   │   ├── AdminOnly.tsx
│   │   ├── PayrollPdfDocument.tsx
│   │   ├── forms/                  # Customer/Crew/Location/ProductType forms
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
│       ├── payroll.ts             # Payroll calculations + types
│       ├── csv.ts                 # CSV export utility
│       ├── mock-data.ts           # Static seed data (unused at runtime)
│       ├── mock-handlers.ts       # Dev-bypass mock API handlers
│       ├── load-readiness.ts      # Load readiness checks
│       └── api/
│           └── client.ts          # Typed fetch wrapper
```

---

## 4. Major Modules

### Loads
- **Routes:** `/loads` (list), `/loads/new` (entry), `/loads/[id]` (detail)
- **Features:** Create load with customer/product-type cascading, assign crew, clock-in/out, billing/payout preview, void/archive
- **Components:** `TicketStub`, `StampBadge`

### Master Data
- **Customers:** CRUD + archive/restore, location assignment
- **Crew (Employees):** CRUD + archive/restore, category selection
- **Locations:** CRUD, card-based list
- **Product Types:** CRUD with rate cards (multi-line bill/pay table)

### Payroll
- **Routes:** `/finance/payroll` (list), `/finance/payroll/[id]` (employee detail)
- **Features:** Pay period selector, crew pay aggregation, approve/pay workflow, PDF export via `DocumentViewer`
- **PDF:** `PayrollPdfDocument` using `@react-pdf/renderer`

### Customer Billing
- **Route:** `/finance/customer-billing`
- **Features:** Completed load selection, billing status (unbilled/invoiced), Create Invoice dialog
- **Flow:** Select loads → `CreateInvoiceDialog` → POST /invoices → loads marked invoiced

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
| `FilterableTable` | `components/FilterableTable.tsx` | Generic filterable/sortable data table with search, filter chips, CSV export. Extended with `searchFn` and `defaultSort` props |
| `ActionsMenu` | `components/ui/ActionsMenu.tsx` | Three-dot kebab dropdown menu |
| `StatusPill` | `components/ui/StatusPill.tsx` | Colored pill with dot (5 tones) |
| `StampBadge` | `components/StampBadge.tsx` | Outlined status badge (legacy pattern) |
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

---

## 7. Mock APIs

When using the dev-bypass token (no backend), `lib/mock-handlers.ts` intercepts all API calls:
- GET/POST/PATCH for all entities (locations, customers, employees, product types, loads, users)
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
- **Dual status components** — `StampBadge` (legacy) and `StatusPill` (newer) coexist
- **Some lint warnings remain** — pre-existing a11y, CSS `!important`, and dependency array issues requiring deeper refactoring

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