# map.md — File/module map

> Navigation aid, not an inventory. Find the section for the domain you're touching, open only the paths listed there. Cross-check against imports/routes before assuming a similarly-named file is the active one — see `AGENTS.md` "Documentation & Session Start" rules.

## Authentication

| Path | Responsibility |
| --- | --- |
| `api/src/plugins/auth.ts` | JWT registration, `authenticate`/`requireSystemUser`/`requireLead` decorators, both realms' token payload types |
| `api/src/routes/auth/index.ts` | `POST /auth/login` — SystemUser (dashboard) login |
| `api/src/routes/lead/auth/index.ts` | Lead login/refresh/logout |
| `api/src/lib/leadAuth.ts` | Refresh-token issuing/rotation for the Lead realm |
| `web/src/lib/auth.tsx` | `AuthProvider`/`useAuth()` — session state, dev-mode bypass (`DEV_MODE` auto-login) |
| `web/src/lib/token.ts` | `localStorage` read/write, `DEV_BYPASS_TOKEN` constant |
| `web/src/app/(app)/layout.tsx` | Route guard — redirects unauthenticated visitors to `/login` |
| `web/src/app/login/page.tsx` | Login form |

## Users & roles

| Path | Responsibility |
| --- | --- |
| `api/prisma/schema.prisma` (`SystemUser`, `Role` enum) | Real model — `Role` is `admin \| lead` only |
| `api/src/routes/users/index.ts` | GET list + POST create only — **no PATCH/toggle-archive** (see `api-map.md`) |
| `web/src/lib/types.ts` (`SystemUser`, `Role`) | Frontend model — 6-value `Role`, `locationIds`, `customerId`, `linkedCrewMemberId` |
| `web/src/lib/users.ts` | `ROLE_KEYS`/`ROLE_LABELS`, `roleRequiresLocations()`, display-name helper |
| `web/src/components/forms/UserForm.tsx` | Create/edit user form — role-conditional fields |
| `web/src/app/(app)/register/page.tsx` | User registration page (nav label "Register") |

## Customers

| Path | Responsibility |
| --- | --- |
| `api/prisma/schema.prisma` (`Customer`) | Real model — simpler than frontend's |
| `api/src/routes/customers/index.ts` | CRUD + toggle-archive, all implemented and matching what `web/` calls |
| `api/src/schemas/domain.ts` (`Customer*Schema`) | Validation — silently drops fields `web/` sends that aren't in the schema (industry/website/taxId/etc.) |
| `web/src/lib/types.ts` (`Customer`) | Rich frontend model |
| `web/src/app/(app)/customers/` | List/new/detail pages |
| `web/src/components/forms/CustomerForm.tsx` | Create/edit form |

## Locations

| Path | Responsibility |
| --- | --- |
| `api/prisma/schema.prisma` (`Location`) | Real model — includes Lead-app JSON config (`containerFields`/`permissions`/`featureFlags`) not used by `web/` |
| `api/src/routes/locations/index.ts` | List/get/create/update + Lead-only `/bootstrap` — **no toggle-archive** |
| `web/src/app/(app)/locations/` | List/new/detail pages |
| `web/src/components/forms/LocationForm.tsx` | Create/edit form |

## Employees ("Crew")

| Path | Responsibility |
| --- | --- |
| `api/prisma/schema.prisma` (`Employee`) | Real model — `name`/`email`/`phone`/`address`/`hourlyRate`/`category`/`locationId` only |
| `api/src/routes/employees/index.ts` | CRUD + toggle-archive; accepts far fewer fields than `web/` sends |
| `web/src/lib/types.ts` (`Employee`, `CrewCertification`, `CrewTrainingRecord`) | Rich frontend model: certifications, skills, training, pay type, employment fields |
| `web/src/lib/crew.ts` | Display-name helpers, `getCertificationStatus()` (derives expired/expiring from `expiresAt`) |
| `web/src/lib/crew-catalogues.ts` | Fixed Skill/Certification-type/Training-type label catalogues (frontend-only, no admin CRUD for the catalogues themselves) |
| `web/src/app/(app)/crew/` | List/new/detail pages (nav label "Crew", route still `/crew`) |
| `web/src/components/forms/CrewMemberForm.tsx` + `CrewCertificationsField.tsx`, `CrewSkillsField.tsx`, `CrewTrainingField.tsx`, `CrewProfilePhotoField.tsx`, `CrewMemberLinkField.tsx` | Crew form and its sub-fields |

## Work Types (internal name `ProductType`, routed `/product-types`)

| Path | Responsibility |
| --- | --- |
| `api/prisma/schema.prisma` (`ProductType`, `RateLine`) | Real model — tiered rate-card (`RateLine[]`), not the pay/billing-type + rate model `web/` uses |
| `api/src/routes/product-types/index.ts` | CRUD + toggle-archive; `RateLine`-shaped fields silently dropped when `web/` posts its own shape |
| `api/src/lib/billing.ts` | `calculateLoadAmounts()` — the one real (non-mock) billing calculation, tiered-rate-card based |
| `web/src/lib/types.ts` (`ProductType`) | Frontend model — `employeePayType`/`employeePayRate`, `customerBillingType`/`customerBillingRate`, `unitOfMeasure` |
| `web/src/app/(app)/product-types/` | List/new/detail pages |
| `web/src/components/forms/ProductTypeForm.tsx` | Create/edit form |

## Loads

| Path | Responsibility |
| --- | --- |
| `api/prisma/schema.prisma` (`Load`, `LoadEmployeeAssignment`) | Real model — 4-state status, flat assignment shape, no snapshots. See `business-rules.md`. |
| `api/src/routes/loads/index.ts` | List/get/create/update/void/archive only — see `api-map.md` for the long list of lifecycle/crew/attachment endpoints that don't exist |
| `web/src/lib/types.ts` (`Load`, `LoadCrewAssignment`, `LoadPaySnapshot`, `LoadBillingSnapshot`, `LoadAttachment`) | Rich frontend model — the one actually used in dev (mock layer) |
| `web/src/lib/mock-handlers.ts` | The real implementation of the 7-state lifecycle, crew clock/break flow, financial recompute, attachments — all in-memory |
| `web/src/lib/load-time.ts` | Worked-minutes derivation, clock/break sequence guards |
| `web/src/lib/load-financials.ts` | `computeLoadFinancials()`, `splitProductionPayout()` |
| `web/src/lib/load-readiness.ts` | `getLoadReadiness()` — the "Complete" blocker/warning gate |
| `web/src/lib/load-attachments.ts`, `use-load-attachments.ts` | In-memory attachment repository + its query hook |
| `web/src/lib/loads.ts` | `formatLoadNumber()`, `getBillingQuantity()`, supervisor-eligibility helpers |
| `web/src/app/(app)/loads/` | List (`page.tsx`), new (thin `LoadForm` wrapper, always `draft`), detail (`[id]/page.tsx` — the operational hub, `HEADER_ACTIONS` status-transition allow-list, `buildLoadActivity()` timeline) |
| `web/src/components/forms/LoadForm.tsx` | Shared create+edit form (mounted on both `/loads/new` and `/loads/[id]`) |
| `web/src/components/loads/` | `CustomerLocationWorkTypeFields.tsx` (cascading picker), `LoadCrewPanel.tsx` (assign/clock/break/remove), `LoadAttachmentsPanel.tsx`, `LoadStatusPill.tsx` |

## Payroll

| Path | Responsibility |
| --- | --- |
| `web/src/lib/payroll.ts` | `getEmployeePayroll()` — reads each Load's frozen `paySnapshot`. **No backend** — see `business-rules.md`. |
| `web/src/lib/use-payroll-records.ts` | Per-employee payroll-status query hook (no bulk endpoint; fetches in parallel) |
| `web/src/app/(app)/finance/payroll/` | List + employee detail pages |
| `web/src/components/PayrollPdfDocument.tsx`, `components/payroll/RecordPaymentDialog.tsx` | PDF export, payment recording |

## Billing & Invoices

| Path | Responsibility |
| --- | --- |
| `web/src/lib/billing.ts` | `formatMoney()`; legacy `calculateLoadAmounts()` for the old `RateLine` model — **zero live callers** per its own comment, don't extend it |
| `web/src/lib/invoices.ts` | In-memory invoice store + types + hardcoded company info. **No backend.** |
| `web/src/lib/use-invoices.ts` | All-invoices query hook (Dashboard's only consumer today) |
| `web/src/app/(app)/finance/customer-billing/` | Select completed/closed loads → create invoice |
| `web/src/app/(app)/finance/invoices/` | Invoice list + detail/PDF preview |
| `web/src/components/invoices/CreateInvoiceDialog.tsx`, `InvoicePdfDocument.tsx` | Invoice creation dialog, PDF document |

## Reporting

| Path | Responsibility |
| --- | --- |
| `web/src/app/(app)/reports/load-entry/` | All loads + filters + CSV |
| `web/src/app/(app)/reports/load-report/` | Completed loads, 5 summary cards |
| `web/src/app/(app)/reports/invoice/` | Legacy completed-loads report |
| `web/src/lib/csv.ts` | `downloadCsv()` |

## Dashboard

| Path | Responsibility |
| --- | --- |
| `web/src/lib/dashboard.ts` | Single source of truth for every Dashboard metric/row/chart-point — `buildScope()`, `selectScopedLoads()`, `selectPeriodLoads()`, per-section `get*` functions |
| `web/src/app/(app)/page.tsx` | Dashboard route, role-aware section composition |
| `web/src/components/dashboard/` | `DashboardHeader`, `OperationsNowTable`, `AttentionRequiredList`, `FinancialWorkflowPanel`, `RankedPerformanceTable`, `WorkforceOverview`, `RecentActivityFeed` |
| `web/src/components/DashboardCharts.tsx` | Recharts wrappers: trend area/line, billing-vs-payout grouped bar, status donut |

## 3PL Intelligence (AI chat — demo only, see `codebase.md` § 6)

| Path | Responsibility |
| --- | --- |
| `web/src/app/(app)/intelligence/` | Chat workspace + knowledge sub-page, full-screen (hides Sidebar) |
| `web/src/lib/intelligence.ts`, `intelligence-chat.tsx` | Types + chat state |
| `web/src/lib/mocks/intelligenceResponse.ts`, `intelligenceStream.ts`, `conversationHistory.ts`, `mockKnowledgeItems.ts` | All mocked response/streaming data — `metadata.demo: true` |
| `web/src/components/intelligence/` | `ChatWorkspace`, `MessageList`, `EvidencePanel`, `KnowledgeCard`, `KnowledgeDetailPanel`, `AddKnowledgeModal`, etc. (11 components) |

## Shared UI primitives

| Path | Responsibility |
| --- | --- |
| `web/src/components/ui/` | `Button`, `Card`, `Field`, `Modal`, `SelectMenu`, `StatCard`, `ActionsMenu` (kebab menu), `ConfirmDialog`, `StatusPill`, `DocumentViewer` (PDF preview modal), `SidekickPanel`, `SectionHeader` |
| `web/src/components/FilterableTable.tsx` | Generic filterable/sortable table — search, filter chips, CSV export, `initialFilterValues` (deep-link seeding) |
| `web/src/components/FilterChip.tsx` | Individual filter chip used by `FilterableTable` |
| `web/src/components/StampBadge.tsx` | Legacy badge — don't use for new status UI, use `StatusPill` |
| `web/src/components/Sidebar.tsx`, `TopBar.tsx` | App chrome — nav (role-filtered `NAV` const), page header |
| `web/src/components/AdminOnly.tsx` | Client-side role gate |

## API services (web → API boundary)

| Path | Responsibility |
| --- | --- |
| `web/src/lib/api/client.ts` | Typed fetch wrapper — routes every call through `handleMockRequest()` first, real `fetch()` second; 401 handling |
| `web/src/lib/mock-handlers.ts` | The in-memory "backend" most dev work actually exercises |
| `web/src/lib/mock-data.ts` | Static seed data backing the mock layer |
| `web/src/lib/store.tsx` | `AppDataProvider` — all TanStack Query fetches + mutations, request-body shaping per entity |

## Database

| Path | Responsibility |
| --- | --- |
| `api/prisma/schema.prisma` | Source of truth for the real DB — always re-derive from this file, never assume |
| `api/prisma/migrations/` | 5 migrations; latest `20260716140000_employee_category` |
| `api/prisma/seed.ts` | 3 locations (Savannah/Charlotte/Dallas), customers, employees, product types, loads, 1 admin + 1 lead |
| `api/src/lib/domain-serializers.ts` | Prisma → response mapping for the back-office domain |
| `api/src/lib/serializers.ts` | Prisma → response mapping for the Lead realm (check-ins, sessions) |

## Configuration

| Path | Responsibility |
| --- | --- |
| `api/src/config/env.ts` | Env schema (`@fastify/env`) — `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` |
| `api/src/config/swagger.ts` | Swagger/OpenAPI generation config — UI at `/docs`, spec at `/docs/json` |
| `api/src/app.ts` | Entry point — registers env + swagger, autoloads `plugins/` and `routes/` |
| `web/.env.local` (gitignored, not present in a fresh checkout — see `README.md`) | `NEXT_PUBLIC_API_URL` (points at the API base URL) |
| `render.yaml` (repo root) | Render Blueprint — Postgres + API + Web deploy config |

## Testing

None exists anywhere in the repo. `api/`'s quality gate is `pnpm typecheck`; `web/`'s is `pnpm lint` (Biome) — neither is a test suite.
