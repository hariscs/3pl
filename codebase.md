# codebase.md — Dockmaster 3PL Operations Platform (Web Frontend)

> **Generated:** 2026-07-19
> **Scope:** `web/` — the Next.js dashboard frontend. The `api/` Fastify backend is referenced but not the primary subject of this document.

---

## 1. Project Overview

**Application name:** Dockmaster (internal brand; package name `3plwork`, public-facing "3PL Work").

**Business purpose:** A 3PL (third-party logistics) dock-operations platform for warehouse staffing companies. The product captures operational work once (loads, crew assignments, quantities), then automatically powers payroll, customer billing, operations dashboards, productivity reports, and business analytics.

**Current development stage:** Active development — the web dashboard RESTYLE is in progress (Increments 1–2 done, Increment 3 pending). The web talks to a real Fastify + Prisma + PostgreSQL backend (not mock). A separate React Native mobile field app exists in a different repo (`threeplmobileapp/`) and is ~100% mock. The two apps (web + mobile) share no code; types are mirrored by hand.

**Users and roles supported:**
| Role       | Access                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| `admin`    | Full access — Setup (Register, Locations, Customers, Crew, Product Types), Load Entry, Loads, Reports |
| `lead`     | Load Entry + Loads only (no setup, no reports, no register)            |
| `customer` | Intended for read-only reporting; **not yet wired into the UI** (the role exists in types but no screens use it) |

**Major workflows currently represented:**
- Login → Dashboard
- Location-aware scoping (user picks a location; all data filters to it)
- Load entry (create a load from form fields)
- Load list (view, void, archive per location)
- Load detail (edit quantities, add/clock-in/clock-out crew, view billing/payout preview, void, archive)
- Customer CRUD + archive/restore
- Crew (Employee) CRUD + archive/restore, with crew category selection
- Location CRUD
- Product Type CRUD with rate card (multi-line bill/pay table)
- User registration (Register page)
- Load Entry Report (filterable table + CSV export)
- Invoice Report (completed loads, filterable + CSV export, total billed)
- Forgot password (5-step multi-screen wizard — identify, verify method, code, reset, done — but **entirely client-side mock with no API calls**)

**Completion status:**
| Module                  | Status                                               |
| ----------------------- | ---------------------------------------------------- |
| Dashboard               | Complete (restyled to mobile clean-card aesthetic)   |
| Login                   | Complete (restyled, connects to real API)            |
| Forgot Password         | **Placeholder/mock** — no API calls, purely UI state |
| Customers CRUD          | Complete                                             |
| Crew (Employees) CRUD   | Complete (restyled, renamed from Employees→Crew)     |
| Locations CRUD          | Complete (restyled)                                  |
| Product Types CRUD      | Complete                                             |
| Load Entry              | Complete (restyled)                                  |
| Load List               | Complete (restyled)                                  |
| Load Detail             | Complete (restyled, crew management functional)      |
| Register User           | Complete (restyled)                                  |
| Load Entry Report       | Complete (admin-only)                                |
| Invoice Report          | Complete (admin-only)                                |
| Leads management        | **Not implemented** (API exists, web pages planned)  |
| Payroll                 | **Not implemented**                                  |
| Invoice builder         | **Not implemented**                                  |
| Financial dashboard     | **Not implemented**                                  |

---

## 2. Technology Stack

| Technology                     | Version   | Where used                           |
| ------------------------------ | --------- | ------------------------------------ |
| Next.js                        | 16.2.10   | Entire app framework (app router)    |
| React                          | 19.2.4    | UI components                        |
| React DOM                      | 19.2.4    | DOM rendering                        |
| TypeScript                     | ^5        | All source code                      |
| Tailwind CSS                   | v4        | Styling (via `@tailwindcss/postcss`) |
| TanStack React Query           | ^5.101.2  | Server-state management (`lib/store.tsx`) |
| TanStack React Query Devtools  | ^5.101.2  | Dev tools (included in bundle)       |
| Recharts                       | ^3.9.2    | Dashboard charts (`DashboardCharts.tsx`) |
| Lucide React                   | ^1.25.0   | Icons (login page feature list)      |
| Sonner                         | ^2.0.7    | Toast notifications (`providers.tsx`, `store.tsx`) |
| Biome                          | 2.2.0     | Linting + formatting (`biome.json`)  |
| React Compiler                 | 1.0.0     | Babel plugin for React Compiler (opt-in via `next.config.ts`) |
| pnpm                           | —         | Package manager (lockfile present)   |
| Node.js                        | ^20 (types) | Runtime                           |

**Notable absences:**
- No form library (forms use plain `useState` + controlled inputs)
- No validation library (validation is manual in submit handlers)
- No dedicated table library (custom `FilterableTable` component)
- No date utility library (uses native `Date` and string slicing)
- No icon library used broadly (Lucide React only on login page; rest of app uses Unicode characters: ⌕, ↕, ▲, ▼, ⋯, ▾, ✕, ✓)
- No testing tools of any kind (no Jest, Vitest, Cypress, Playwright)
- No state management library beyond React Context + TanStack Query

---

## 3. Project Structure

```
web/
├── package.json              # Dependencies + scripts
├── pnpm-lock.yaml            # Lockfile
├── pnpm-workspace.yaml       # pnpm workspace config
├── tsconfig.json             # TypeScript configuration
├── next.config.ts            # Next.js 16 configuration (React Compiler enabled)
├── biome.json                # Biome 2.2 linting + formatting config
├── postcss.config.mjs        # Tailwind CSS v4 PostCSS plugin
├── AGENTS.md                 # Agent conventions (same as root AGENTS.md)
├── README.md                 # Repo-level README
├── meeting_transcript.txt    # Client meeting notes (reference only)
├── public/
│   ├── assets/
│   │   ├── warehouse.svg     # Warehouse illustration (login page background)
│   │   ├── warehouse-123.svg # Alternate warehouse illustration
│   │   └── forklift.svg      # Forklift illustration (unused? not referenced in code)
│   └── *.svg                 # Next.js boilerplate SVGs (unused)
└── src/
    ├── app/
    │   ├── globals.css       # Global styles, CSS custom properties, Tailwind v4 import
    │   ├── layout.tsx        # Root layout: fonts, metadata, <Providers> wrapper
    │   ├── favicon.ico
    │   ├── (app)/             # Authenticated app shell route group
    │   │   ├── layout.tsx     # Auth guard + Sidebar shell + AppDataProvider
    │   │   ├── page.tsx       # Dashboard
    │   │   ├── crew/          # Crew (Employees) — list, new, [id]
    │   │   ├── customers/     # Customers — list, new, [id]
    │   │   ├── loads/         # Loads — list, new, [id]
    │   │   ├── locations/     # Locations — list, new, [id]
    │   │   ├── product-types/ # Product Types — list, new, [id]
    │   │   ├── register/      # User registration
    │   │   └── reports/
    │   │       ├── load-entry/ # Load Entry Report
    │   │       └── invoice/   # Invoice Report
    │   ├── login/             # Login page (public)
    │   └── forgot-password/   # Forgot password page (public)
    ├── components/
    │   ├── Sidebar.tsx        # Sidebar navigation
    │   ├── TopBar.tsx         # Top header bar (title + location selector + user badge)
    │   ├── DashboardCharts.tsx # Recharts bar charts (Loads/ Day, Billed vs Payout)
    │   ├── FilterableTable.tsx # Reusable filterable, sortable, searchable table
    │   ├── FilterChip.tsx     # Filter chip UI (text/select filter popover)
    │   ├── StampBadge.tsx     # Status badge (Active/ Archived/ Complete/ Void)
    │   ├── TicketStub.tsx     # Ticket-styled load card (with perforated edge)
    │   ├── AdminOnly.tsx      # Role gate wrapper (shows "Admin only" message for non-admins)
    │   ├── forms/
    │   │   ├── CustomerForm.tsx
    │   │   ├── EmployeeForm.tsx
    │   │   ├── LocationForm.tsx
    │   │   └── ProductTypeForm.tsx
    │   └── ui/
    │       ├── Button.tsx      # Button primitive (primary/secondary/danger/ghost)
    │       ├── Card.tsx        # Card container (rounded-2xl, border, shadow)
    │       ├── Field.tsx       # Form field wrapper + Input/Select/Textarea
    │       ├── Modal.tsx       # Modal dialog
    │       ├── ActionsMenu.tsx # Kebab (⋯) dropdown menu
    │       ├── ConfirmDialog.tsx # Confirmation modal (uses Modal + Button)
    │       ├── SectionHeader.tsx # Section label with optional action link/button
    │       ├── StatCard.tsx    # Large-stat display card
    │       └── StatusPill.tsx  # Colored pill with dot (success/muted/warning/danger/info)
    ├── lib/
    │   ├── types.ts           # All shared TypeScript types (mirrors api/src/schemas/domain.ts)
    │   ├── auth.tsx           # AuthContext + AuthProvider (login/logout/session restore)
    │   ├── token.ts           # localStorage token/ user persistence helpers
    │   ├── store.tsx          # AppDataContext + AppDataProvider (TanStack Query + mutations)
    │   ├── providers.tsx      # Root client providers (QueryClient + Auth + Toaster)
    │   ├── billing.ts         # Billing/payout calculation from rate lines
    │   ├── csv.ts             # CSV export utility
    │   ├── mock-data.ts       # Static mock data (UNUSED in production — all data comes from API)
    │   └── api/
    │       └── client.ts      # Typed fetch wrapper (ApiError, Bearer token, 401 handling)
    └── assets/
        └── warehouse.svg     # Duplicate of public/assets/ warehouse.svg
```

**Key files (entry points):**
- `web/src/app/layout.tsx` — Root layout (fonts, `<Providers>`)
- `web/src/app/(app)/layout.tsx` — Authenticated shell (auth guard, sidebar, AppDataProvider)
- `web/src/lib/providers.tsx` — React Query + Auth + Toaster setup
- `web/src/lib/store.tsx` — Central data store (all queries + mutations)
- `web/src/lib/api/client.ts` — API client (fetch wrapper)
- `web/src/lib/types.ts` — All domain types

---

## 4. Application Architecture

**Organization:** Layer-based (not feature-based). Pages live under `app/`, shared components under `components/`, data/state under `lib/`.

**How pages are composed:**
- Every authenticated page wraps content in `<TopBar>` + `<main>`
- Admin-only pages additionally wrap in `<AdminOnly>`
- Forms use `<Card>` as container with a `<form>` inside
- List pages use `<Card>` wrapping `<FilterableTable>`
- The dashboard is a free-form composition of `<StatCard>`, `<Card>`, charts

**How shared components are organized:**
- `components/ui/` — Primitive design-system components (Button, Card, Field, Modal, etc.)
- `components/forms/` — Domain-specific form components (one per entity)
- `components/` (root) — Layout components (Sidebar, TopBar) and data-display components (FilterableTable, DashboardCharts, TicketStub, StampBadge)

**Layout system:**
- Root layout (`app/layout.tsx`) applies fonts and wraps in `<Providers>`
- Authenticated route group `(app)/layout.tsx` adds auth guard + `<Sidebar>` + `<AppDataProvider>`
- No nested layouts within the app shell; each page is responsible for its own `<TopBar>` + `<main>`

**Routes connect to pages via Next.js App Router file-system routing:**
- `(app)/` → authenticated shell
- `(app)/page.tsx` → `/` (Dashboard)
- `(app)/loads/page.tsx` → `/loads`
- `(app)/loads/[id]/page.tsx` → `/loads/:id`
- etc.

**State flow:**
1. `AuthProvider` manages auth state (user, status, login/logout functions)
2. `AppDataProvider` wraps authenticated pages, fetches all entity lists via TanStack Query (6 parallel queries), and provides mutation functions
3. Pages consume data via `useAppData()` hook, which provides the full `AppData` context object
4. Mutations use `withToast()` wrapper → call `api.post/patch` → invalidate query cache → show success/error toast
5. The `currentLocationId` is stored in `AppDataProvider` state and persisted only in React state (no URL, no localStorage) — it resets on page reload

**How services are called:**
- Single API client (`lib/api/client.ts`) — a fetch wrapper with JSON serialization, Bearer token from localStorage, 401 handling (clears session + redirects)
- All API calls go through `api.get<T>`, `api.post<T>`, `api.patch<T>`
- Base URL: `NEXT_PUBLIC_API_URL` env var (defaults to `http://localhost:4000`)
- All paths are under `/api/v1/`

**Mock data:** `lib/mock-data.ts` exists but is **NOT imported anywhere in the application**. All data comes from the real API. The mock data file appears to be a leftover from early development; it has 7 loads, 6 employees, 4 customers, 3 locations, 6 product types, and 3 system users. These match the seed data in `api/prisma/seed.ts`.

**Forms:** All forms use controlled inputs with local `useState`. No form library. Validation is manual inside submit handlers (e.g., checking `!customerId || !productTypeId`).

**Error/loading states:**
- Loading: `isLoading` boolean from `AppDataContext` (true while any of the 6 queries is loading). The app shell shows "Loading…" centered text while `status !== 'authenticated'`.
- Errors: Mutations use `withToast()` which catches `ApiError` and shows `toast.error()`. Queries use TanStack Query's built-in error handling (retry: 1). There is **no error boundary** component.
- Empty states: Most list pages show "No X at this location yet" or "No rows match these filters."

**Permissions/roles:**
- `AdminOnly` component wraps admin-only pages (shows a polite message for non-admins)
- Sidebar hides admin-only nav sections from non-admin roles
- Role is derived from the logged-in user (`user.role`), not from a separate permission system
- Void and archive actions are conditionally rendered for admin role only in load pages

**Inconsistencies/mixed patterns:**
- The `mock-data.ts` file is unused but present — can confuse new developers
- `StampBadge` handles both `RecordStatus` and `LoadStatus` via a union type, but `StatusPill` is the newer design system component for similar status display
- `TicketStub` uses the old "ticket stub" design pattern which was supposed to be retired per the PLANNED web restyle (Increment 4 not yet done)
- Some pages use `StampBadge` (customers, crew, product-types, reports), loads pages use `StatusPill` for "In progress", and load detail/load list use `StampBadge` — inconsistent
- The login page uses hardcoded blue/slate color values instead of the shared CSS custom properties
- The login page has its own standalone design (split panel, feature list, warehouse background) that diverges from the rest of the app's style

---

## 5. Routing

### Route inventory

| URL | Page Component | Layout | Protected | Allowed Roles | Route Params | Query Params | Status | Purpose |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/login` | `app/login/page.tsx` | Root (public) | No | — | — | — | **Complete** | Login form |
| `/forgot-password` | `app/forgot-password/page.tsx` | Root (public) | No | — | — | — | **Mock/Placeholder** | Password reset wizard (no API calls) |
| `/` | `app/(app)/page.tsx` | App shell | Yes | admin, lead | — | — | **Complete** | Dashboard |
| `/loads` | `app/(app)/loads/page.tsx` | App shell | Yes | admin, lead | — | — | **Complete** | Load list (per location) |
| `/loads/new` | `app/(app)/loads/new/page.tsx` | App shell | Yes | admin, lead | — | — | **Complete** | Load entry form |
| `/loads/[id]` | `app/(app)/loads/[id]/page.tsx` | App shell | Yes | admin, lead | `id: string` | — | **Complete** | Load detail (quantities + crew) |
| `/customers` | `app/(app)/customers/page.tsx` | App shell | Yes | admin | — | — | **Complete** | Customer list |
| `/customers/new` | `app/(app)/customers/new/page.tsx` | App shell | Yes | admin | — | — | **Complete** | New customer form |
| `/customers/[id]` | `app/(app)/customers/[id]/page.tsx` | App shell | Yes | admin | `id: string` | — | **Complete** | Edit customer |
| `/crew` | `app/(app)/crew/page.tsx` | App shell | Yes | admin | — | — | **Complete** | Crew list (was `/employees`) |
| `/crew/new` | `app/(app)/crew/new/page.tsx` | App shell | Yes | admin | — | — | **Complete** | New crew member |
| `/crew/[id]` | `app/(app)/crew/[id]/page.tsx` | App shell | Yes | admin | `id: string` | — | **Complete** | Edit crew member |
| `/locations` | `app/(app)/locations/page.tsx` | App shell | Yes | admin | — | — | **Complete** | Location cards |
| `/locations/new` | `app/(app)/locations/new/page.tsx` | App shell | Yes | admin | — | — | **Complete** | New location |
| `/locations/[id]` | `app/(app)/locations/[id]/page.tsx` | App shell | Yes | admin | `id: string` | — | **Complete** | Edit location |
| `/product-types` | `app/(app)/product-types/page.tsx` | App shell | Yes | admin | — | — | **Complete** | Product type list |
| `/product-types/new` | `app/(app)/product-types/new/page.tsx` | App shell | Yes | admin | — | — | **Complete** | New product type |
| `/product-types/[id]` | `app/(app)/product-types/[id]/page.tsx` | App shell | Yes | admin | `id: string` | — | **Complete** | Edit product type |
| `/register` | `app/(app)/register/page.tsx` | App shell | Yes | admin | — | — | **Complete** | Register new user |
| `/reports/load-entry` | `app/(app)/reports/load-entry/page.tsx` | App shell | Yes | admin | — | — | **Complete** | Load Entry Report |
| `/reports/invoice` | `app/(app)/reports/invoice/page.tsx` | App shell | Yes | admin | — | — | **Complete** | Invoice Report |

**Redirect behavior:**
- Authenticated users visiting `/login` are redirected to `/` (via `useEffect` in login page)
- Unauthenticated users visiting any `(app)` route are redirected to `/login` (via `useEffect` in app shell layout)
- 401 responses from the API cause `handleUnauthorized()` which clears session and redirects to `/login` via `window.location.assign`

**404 handling:** Next.js default 404 page — no custom 404 page exists.

**Nested routes:** None. All routes are flat within `(app)/`.

**Route guards:**
- `(app)/layout.tsx` — checks `status === 'authenticated'`, redirects to `/login` if unauthenticated
- `AdminOnly` component — checks `role === 'admin'`, shows message for non-admins (used as a wrapper in pages, not a route-level guard)

**Role-based route handling:**
- Sidebar filters nav sections based on role (admin sections hidden from lead/customer)
- `AdminOnly` wraps admin-only pages
- Void/archive buttons conditionally rendered based on `role === 'admin'`

---

## 6. Layouts and Navigation

### Main application layout (`(app)/layout.tsx`)
- Full-height flex container with `<Sidebar>` (fixed 240px left) + scrollable content area
- Auth guard: unauthenticated → redirect to `/login`; loading → centered "Loading…" text on dark background
- Authenticated: renders `<AppDataProvider>` → `<Sidebar>` + `<div>{children}</div>`

### Sidebar (`components/Sidebar.tsx`)
- **Width:** 240px (`w-60`)
- **Branding:** "Dockmaster" title + "3PL Operations" subtitle
- **Navigation sections:**
  | Section    | Admin Only | Items                                                                 |
  | ---------- | ---------- | --------------------------------------------------------------------- |
  | Operations | No         | Dashboard (`/`)                                                       |
  | Setup      | Yes        | Register (`/register`), Locations (`/locations`), Customers (`/customers`), Crew (`/crew`), Product Types (`/product-types`) |
  | Loads      | No         | Load Entry (`/loads/new`), Loads (`/loads`)                           |
  | Reports    | Yes        | Load Entry Report (`/reports/load-entry`), Invoice Report (`/reports/invoice`) |
- **Active state:** Left border accent (rust color) + bold text + darker background
- **User footer:** Shows "Signed in as {name} · {role}" + "Sign out" button
- **Design:** Dark sidebar (`bg-ink`) with light text — intentionally dark (user preference), rest of app is light

### Top bar (`components/TopBar.tsx`)
- Sticky header with page title + description (left)
- User badge (name + role pill) + Location selector dropdown (right)
- Props: `title: string`, `description?: string`

### Breadcrumbs: None.

### Mobile navigation: None. The sidebar is always visible (no responsive collapse). The app does not have responsive breakpoints for mobile — it is desktop-only.

### User menu: The sidebar footer has a "Sign out" button. There is no dropdown user menu, profile page, or settings page.

### Notifications: Toast notifications via Sonner (`<Toaster position="bottom-right" />`). Used for mutation success/error feedback.

### Page container structure:
```
<TopBar title="..." description="..." />
<AdminOnly>          ← only on admin pages
  <main className="flex-1 p-6">
    <Card>           ← typically wraps content
      ...
    </Card>
  </main>
</AdminOnly>
```

**Navigation items pointing to missing/placeholder pages:** None. All sidebar items map to existing pages.

---

## 7. Authentication and User Roles

### Login flow
1. User visits `/login`, enters email + password
2. `useAuth().login()` calls `api.post('/auth/login', { email, password })`
3. API returns `{ token: string, user: SystemUser }`
4. `storeSession(token, user)` stores both in localStorage under keys `dockmaster.token` and `dockmaster.user`
5. Auth state updates → user is redirected to `/`

### Logout flow
1. `useAuth().logout()` clears localStorage (`clearSession()`), clears TanStack Query cache, sets user to null, redirects to `/login`

### Session persistence
- Token and user object stored in localStorage
- On app load, `AuthProvider` reads localStorage in a `useEffect` (client-only)
- If token + user exist → status = "authenticated"
- If not → status = "unauthenticated"

### Token handling
- `lib/token.ts` — `getToken()`, `getStoredUser()`, `storeSession()`, `clearSession()`
- localStorage keys: `dockmaster.token`, `dockmaster.user`
- Token sent as `Authorization: Bearer <token>` header on every API request
- 401 responses trigger `clearSession()` + redirect to `/login`

### Current-user storage: `SystemUser` object in localStorage + React state in `AuthContext`

### Protected routes
- All `(app)/` routes require authentication (checked in `(app)/layout.tsx`)
- `AdminOnly` component gates admin-only pages within the app shell

### Role-based access
- `admin` — full access (all routes, all actions)
- `lead` — can access Dashboard, Load Entry, Loads; cannot access Setup, Reports, or Register
- `customer` — defined in types but not used in any UI logic

### Mock credentials (demo data in README and seed)
- All seeded accounts use password `1234`
- Admin: `rick@dockmaster3pl.com`
- Lead: `josie.turner@example.com`
- Customer: `j.reyes@geodis.com`
- These are demo credentials intentionally published in the repo README

### Password reset
- **Entirely mock/placeholder** — `forgot-password/page.tsx` is a 5-step wizard (identify → verify method → enter code → new password → done) but **makes zero API calls**
- Steps transition via local `useState` only
- Code validation: any 6 digits accepted
- Password validation: min 8 chars, must match confirm
- No actual password reset occurs

### Remember-me behavior
- Login page has a "Remember me" checkbox, but it is **not wired to anything** — it toggles local state that is never read or used
- The token is always persisted to localStorage regardless of this checkbox

### Security limitations
- Tokens stored in localStorage (vulnerable to XSS)
- No token expiry handling beyond 401 detection
- No CSRF protection visible in the frontend
- Password reset is non-functional
- "Remember me" has no effect
- Role is derived client-side from stored user object (could be tampered with, though the API enforces authorization)

---

## 8. Design System and UI Patterns

### Colors (CSS custom properties defined in `globals.css`)

| Token              | Value     | Usage                                     |
| ------------------ | --------- | ----------------------------------------- |
| `--color-ink`      | `#0f172a` | Primary text (slate-900)                  |
| `--color-ink-soft` | `#1e293b` | Darker surface (sidebar, hover states)    |
| `--color-ink-line` | `#334155` | Sidebar border                            |
| `--color-paper`    | `#f8fafc` | Page background (slate-50)                |
| `--color-paper-dim`| `#f1f5f9` | Alternate row background (slate-100)      |
| `--color-cream`    | `#ffffff` | Card background (white)                   |
| `--color-manila`   | `#f1f5f9` | Table header, subtle backgrounds           |
| `--color-manila-dark`| `#e2e8f0` | Borders (slate-200)                      |
| `--color-rust`     | `#2563eb` | Primary accent (blue-600)                 |
| `--color-rust-dark`| `#1d4ed8` | Primary hover (blue-700)                  |
| `--color-rust-soft`| `#eff6ff` | Primary soft bg (blue-50)                 |
| `--color-freight`  | `#16a34a` | Success/active (green-600)               |
| `--color-freight-dark`| `#15803d` | Success dark                             |
| `--color-freight-soft`| `#f0fdf4` | Success soft bg                           |
| `--color-stamp`    | `#dc2626` | Danger/error (red-600)                    |
| `--color-stamp-soft`| `#fef2f2` | Danger soft bg                            |
| `--color-steel`    | `#64748b` | Muted text (slate-500)                    |
| `--color-steel-light`| `#94a3b8` | Lighter muted text (slate-400)          |
| `--color-amber`    | `#d97706` | Warning                                    |
| `--color-amber-soft`| `#fffbeb` | Warning soft bg                           |
| `--color-chart-1`  | `#2a78d6` | Chart series 1 (blue)                     |
| `--color-chart-2`  | `#008300` | Chart series 2 (green)                    |

**Note:** Color names are intentionally themed ("ink", "paper", "rust", "freight", "stamp") rather than semantic ("primary", "success", "danger"). The login page ignores these and uses hardcoded slate/blue Tailwind classes.

### Typography
- **Font family:** Inter (body + headings), Geist Mono (tabular numbers / `font-tick`)
- **Font variables:** `--font-inter`, `--font-geist-mono`
- **Utility classes:** `font-display` (Inter), `font-body` (Inter), `font-tick` (Geist Mono)
- **Scale:** Not systematized — uses Tailwind text utilities (`text-xs`, `text-sm`, `text-lg`, `text-xl`, `text-3xl`) directly

### Spacing
- Tailwind default spacing scale
- Page padding: `p-6` (24px)
- Card padding: `p-5` (20px)
- Form gaps: `gap-4` (16px)
- Section gaps: `space-y-6` (24px)

### Border radius
- Cards: `rounded-2xl` (16px)
- Buttons: `rounded-xl` (12px)
- Form inputs: `rounded-xl` (12px)
- Modals: `rounded-md` (6px)
- Pills/badges: `rounded-full`
- Sidebar links: `rounded-sm` (2px)

### Shadows
- `--shadow-card`: `0 4px 14px rgb(15 23 42 / 0.04)` — used on cards
- Modals have `shadow-xl`

### Breakpoints
- Tailwind default breakpoints (`sm:`, `lg:`, `xl:`, `2xl:`)
- Grid cards: `sm:grid-cols-2`, `xl:grid-cols-3`
- Forms: `sm:grid-cols-2`, `sm:grid-cols-3`
- **No mobile-specific responsive behavior** — the app is desktop-first with some tablet breakpoints

### Container widths
- Sidebar: `w-60` (240px)
- Content: flex-1 (fills remaining width)
- Modal: `max-w-md` (448px)
- Login card: `max-w-sm` (384px)
- Tables: `w-full` with `min-w-max` (horizontally scrollable on small screens)

### Button variants (`components/ui/Button.tsx`)
| Variant    | Background   | Text    | Border           |
| ---------- | ------------ | ------- | ---------------- |
| `primary`  | rust         | cream   | rust             |
| `secondary`| cream        | ink     | manila-dark      |
| `danger`   | cream        | stamp   | stamp/40         |
| `ghost`    | transparent  | steel   | transparent      |

### Form field styles (`components/ui/Field.tsx`)
- Base: `rounded-xl border border-manila-dark bg-cream` with focus ring (`focus:border-rust focus:ring-2 focus:ring-rust/20`)
- Label: `text-sm font-semibold text-ink` with red asterisk for required
- Hint: `text-xs text-steel-light`

### Cards (`components/ui/Card.tsx`)
- `rounded-2xl border border-manila-dark bg-cream shadow-card`
- Optional title with bottom border separator

### Badges/Status
- `StampBadge`: Outlined pill style (`ink-stamp` class) — border + background using `color-mix` from current text color
- `StatusPill`: Filled pill with colored dot — 5 tones: success, muted, warning, danger, info

### Tables
- Custom `FilterableTable` component
- Header: `bg-manila` background, uppercase `text-xs font-semibold`
- Rows: alternating `bg-paper` / `bg-paper-dim/40`, hover `bg-manila/40`
- Sortable columns show ↕/▲/▼ icons
- Search bar + filter chips above table
- Row count display + "Export to Excel" (CSV) button
- Empty state: "No rows match these filters."

### Loading states
- Auth loading: centered "Loading…" on dark bg
- Data loading: `isLoading` from AppDataContext — but **not visually indicated** in most pages (no spinner or skeleton)
- Chart empty: "No load data yet."

### Modals
- `Modal`: Fixed overlay (`bg-ink/60`) + centered card (max-w-md)
- `ConfirmDialog`: Uses Modal + title + body text + Cancel/Confirm buttons

### Dropdowns
- `ActionsMenu`: Three-dot (⋯) button → dropdown menu (positioned absolute right-0)
- `FilterChip` / `AddFilterChip`: Popover-style dropdowns for filter selection

### Toasts
- Sonner `Toaster` at `bottom-right`
- Used in `withToast()` wrapper for all mutations
- Success: green toast, Error: red toast with API error message

### Tabs
- `register/page.tsx` has a custom tab-like toggle ("Choose from list" / "Fetch current location") using button group styling — not a reusable component

### Pagination: None. All lists display all records (no server-side or client-side pagination).

### Charts
- `DashboardCharts.tsx` — Two Recharts bar charts:
  - `LoadsPerDayChart`: Single bar series (loads/day)
  - `BillingPayoutChart`: Dual bar series (billed vs payout) with legend
- Data: Last 7 days of loads at the current location

---

## 9. Shared Components Inventory

| Component          | Path                              | Purpose                                      | Important Props                              | Used In                        | Reusable? | Limitations                              |
| ------------------ | --------------------------------- | -------------------------------------------- | -------------------------------------------- | ------------------------------ | --------- | ---------------------------------------- |
| `Sidebar`          | `components/Sidebar.tsx`          | App sidebar navigation                       | — (reads auth + app data from context)        | `(app)/layout.tsx`             | Yes       | Hardcoded nav items; no collapse          |
| `TopBar`           | `components/TopBar.tsx`           | Page header with title + location selector   | `title`, `description?`                       | Every authenticated page       | Yes       | —                                        |
| `DashboardCharts`  | `components/DashboardCharts.tsx`  | Recharts bar charts for dashboard            | `data: DayPoint[]`                            | Dashboard page                 | Partially | Only two chart types; data format fixed   |
| `FilterableTable`  | `components/FilterableTable.tsx`  | Filterable, sortable, searchable data table  | `columns`, `rows`, `getRowKey`, `onExport?`, `defaultFilterKeys?` | Customers, Crew, Product Types, Reports | Yes       | No pagination; all client-side            |
| `FilterChip`       | `components/FilterChip.tsx`       | Individual filter chip popover               | `column`, `value`, `onChange`, `onRemove`     | `FilterableTable`              | Yes       | Used only within FilterableTable          |
| `StampBadge`       | `components/StampBadge.tsx`       | Status badge (Active/Archived/Complete/Void) | `status: LoadStatus \| RecordStatus`          | Customers, Crew, Product Types, Loads, Reports | Yes       | Only 4 statuses configured               |
| `TicketStub`       | `components/TicketStub.tsx`       | Ticket-styled load card                      | `ticketNumber`, `status`, `date`, `href?`, `eyebrow`, `title`, `fields`, `actions?` | Loads list page                | Yes       | Old design pattern (slated for restyle)   |
| `AdminOnly`        | `components/AdminOnly.tsx`        | Role gate (admin-only content wrapper)       | `children`                                   | All Setup, Register, Reports pages | Yes       | Client-side only (cosmetic, not security) |
| `Button`           | `components/ui/Button.tsx`        | Button with 4 variants                       | `variant`, all HTML button attrs              | Throughout                     | Yes       | —                                        |
| `Card`             | `components/ui/Card.tsx`          | Card container                               | `title?`, `action?`, `children`, `className?` | Throughout                     | Yes       | —                                        |
| `Field`            | `components/ui/Field.tsx`         | Form field wrapper + Input/Select/Textarea   | `label`, `hint?`, `required?`                 | All forms + register + load entry | Yes    | —                                        |
| `Modal`            | `components/ui/Modal.tsx`         | Modal dialog overlay                         | `open`, `onClose`, `title`, `children`        | `ConfirmDialog`                | Yes       | Fixed max-w-md; no size variants          |
| `ActionsMenu`      | `components/ui/ActionsMenu.tsx`   | Kebab dropdown menu                          | `actions: Action[]`, `label?`                 | Not currently used in pages    | Yes       | Only used in table rows — deferred        |
| `ConfirmDialog`    | `components/ui/ConfirmDialog.tsx` | Confirmation modal                            | `open`, `title`, `body`, `confirmLabel`, `variant`, `onConfirm`, `onClose` | Customers, Crew, Product Types, Loads | Yes | —                                        |
| `SectionHeader`    | `components/ui/SectionHeader.tsx` | Section label with optional action           | `title`, `actionLabel?`, `href?`, `onAction?` | Dashboard                      | Yes       | Limited use                              |
| `StatCard`         | `components/ui/StatCard.tsx`      | Large stat display card                      | `label`, `value`, `hint?`                     | Dashboard                      | Yes       | —                                        |
| `StatusPill`       | `components/ui/StatusPill.tsx`    | Colored pill with dot                        | `tone?`, `children`                           | Dashboard, Crew list           | Yes       | 5 tones available                        |
| `CustomerForm`     | `components/forms/CustomerForm.tsx` | Customer create/edit form                  | `initial?`, `submitLabel`, `onSubmit`         | Customers new, Customers [id]  | Yes       | —                                        |
| `EmployeeForm`     | `components/forms/EmployeeForm.tsx` | Crew create/edit form                      | `initial?`, `submitLabel`, `onSubmit`         | Crew new, Crew [id]            | Yes       | —                                        |
| `LocationForm`     | `components/forms/LocationForm.tsx` | Location create/edit form                  | `initial?`, `submitLabel`, `onSubmit`         | Locations new, Locations [id]  | Yes       | —                                        |
| `ProductTypeForm`  | `components/forms/ProductTypeForm.tsx` | Product type create/edit form with rate card | `initial?`, `submitLabel`, `onSubmit`       | Product Types new, Product Types [id] | Yes | Rate card IDs are local draft IDs        |

---

## 10. Existing Screens

### 1. Login Page
- **Route:** `/login`
- **File:** `app/login/page.tsx`
- **Role:** Public (unauthenticated)
- **Purpose:** Authenticate dashboard users
- **Main sections:** Left panel (branding + feature list + warehouse background), Right panel (login card with email, password, remember me, forgot password link, sign-in button)
- **Main actions:** Sign in
- **Components used:** `Button`, `Field`, `Input`, Lucide icons (`ArrowRight`, `Eye`, `EyeOff`, `Brain`, `ChartNoAxesCombined`, `ClipboardList`, `Clock`, `DollarSign`, `Sparkles`, `Users`)
- **Data source:** `useAuth().login()` → API
- **Loading behavior:** Button shows "Signing in…" + disabled state while submitting
- **Empty state:** N/A
- **Error state:** Red error banner below form fields for invalid credentials
- **Responsive:** Split panel on desktop (58/42), stacked on mobile (login card with smaller banner)
- **Actions functional:** Login works; "Remember me" is non-functional; "Forgot password" links to placeholder page
- **Missing functionality:** "Remember me" not wired
- **Known UX concerns:** Login page uses hardcoded color classes (not shared design tokens); feature list (AI Crew Matching, Smart Forecasting, Predictive Analytics) describes planned features not yet built

### 2. Forgot Password Page
- **Route:** `/forgot-password`
- **File:** `app/forgot-password/page.tsx`
- **Role:** Public
- **Purpose:** Password reset wizard
- **Main sections:** 5-step wizard (identify → verify method → code → reset → done)
- **Main actions:** Continue, Send code, Verify, Reset password, Back to Dockmaster
- **Components used:** `Button`, `Field`, `Input`
- **Data source:** None (all mock)
- **Loading:** None
- **Error:** Client-side validation only (6-digit code, min 8 char password, password match)
- **Responsive:** Centered card on dark background
- **Actions functional:** **None** — all steps are local UI state transitions with no API calls

### 3. Dashboard Page
- **Route:** `/`
- **File:** `app/(app)/page.tsx`
- **Role:** admin, lead
- **Purpose:** Location-scoped overview of operations
- **Main sections:** Current location card, 4 stat tiles (Active loads, Completed, Crew on site, Customers), 2 charts (Loads per day, Billed vs payout), Active loads list, Quick actions
- **Main actions:** New load (link), View all loads (link), Quick action links (role-filtered)
- **Components used:** `TopBar`, `StatCard`, `Card`, `SectionHeader`, `StatusPill`, `Button`, `LoadsPerDayChart`, `BillingPayoutChart`
- **Data source:** `useAppData()` — all entity lists, filtered by `currentLocationId`
- **Loading:** No explicit loading state for data (flashes empty stats while loading)
- **Empty state:** Charts show "No load data yet."; Active loads section shows "No active loads at this location." inside `<Card>`
- **Error:** Handled by TanStack Query (silent retry; no visible error state on dashboard)
- **Responsive:** Stats grid 2-col on mobile, 4-col on desktop; charts stacked on mobile, 2-col on desktop
- **Actions functional:** All links and buttons work
- **Missing functionality:** No real-time updates; charts only show last 7 days with no date range picker
- **Known UX concerns:** Dashboard flashes empty/zero values while queries load; no skeleton or spinner

### 4. Customers List
- **Route:** `/customers`
- **File:** `app/(app)/customers/page.tsx`
- **Role:** admin
- **Purpose:** View and manage customer records
- **Main sections:** Filterable table with columns: Display Name, Legal Name, Contact (name + email), Locations, Status, Actions (Edit, Archive/Restore)
- **Main actions:** New customer, Edit, Archive/Restore (with confirmation dialog)
- **Components used:** `AdminOnly`, `TopBar`, `Button`, `Card`, `FilterableTable`, `StampBadge`, `ConfirmDialog`
- **Data source:** `useAppData().customers`
- **Loading:** No explicit loading state
- **Empty state:** Table shows "No rows match these filters." (no dedicated empty state for zero customers)
- **Error:** TanStack Query default (silent retry)
- **Responsive:** Table horizontally scrollable on small screens
- **Actions functional:** All CRUD operations work via API
- **Missing functionality:** No bulk actions; no inline create

### 5. New Customer
- **Route:** `/customers/new`
- **File:** `app/(app)/customers/new/page.tsx`
- **Role:** admin
- **Purpose:** Create a new customer
- **Main sections:** Form card with fields: Contact name, Contact email, Phone, Display name, Legal company name, Location checkboxes
- **Main actions:** Create customer (submits + redirects to `/customers`)
- **Components used:** `AdminOnly`, `TopBar`, `Card`, `CustomerForm`
- **Data source:** `useAppData().addCustomer()` → API
- **Loading:** Submit button (no explicit loading state)
- **Empty state:** N/A
- **Error:** Toast notification on failure
- **Responsive:** Form 2-col on desktop
- **Actions functional:** Create works
- **Missing functionality:** No unsaved-changes warning

### 6. Edit Customer
- **Route:** `/customers/[id]`
- **File:** `app/(app)/customers/[id]/page.tsx`
- **Role:** admin
- **Purpose:** Edit existing customer
- **Main sections:** Customer details card with form (pre-filled) + archive/restore action in header
- **Main actions:** Save changes, Archive/Restore
- **Components used:** `AdminOnly`, `TopBar`, `Card`, `CustomerForm`, `StampBadge`, `Button`, `ConfirmDialog`
- **Data source:** `useAppData().customers`, `updateCustomer()`, `toggleCustomerArchive()`
- **Error:** "Customer not found" if ID doesn't match
- **Actions functional:** Edit and archive/restore work

### 7. Crew List (Employees)
- **Route:** `/crew`
- **File:** `app/(app)/crew/page.tsx`
- **Role:** admin
- **Purpose:** View and manage crew (employee) records
- **Main sections:** Filterable table: Name, Contact (email + phone), Category (pill), Location, Hourly Rate, Status, Actions (Edit, Archive/Restore)
- **Components used:** `AdminOnly`, `TopBar`, `Button`, `Card`, `FilterableTable`, `StampBadge`, `StatusPill`, `ConfirmDialog`
- **Data source:** `useAppData().employees`
- **Actions functional:** All CRUD + archive/restore work via API

### 8. New Crew Member
- **Route:** `/crew/new`
- **File:** `app/(app)/crew/new/page.tsx`
- **Role:** admin
- **Purpose:** Add a new crew member
- **Main sections:** Form card with EmployeeForm fields
- **Components used:** `AdminOnly`, `TopBar`, `Card`, `EmployeeForm`
- **Actions functional:** Create works

### 9. Edit Crew Member
- **Route:** `/crew/[id]`
- **File:** `app/(app)/crew/[id]/page.tsx`
- **Role:** admin
- **Purpose:** Edit existing crew member
- **Main sections:** Crew details card with form + archive/restore
- **Components used:** `AdminOnly`, `TopBar`, `Card`, `EmployeeForm`, `StampBadge`, `Button`, `ConfirmDialog`
- **Actions functional:** Edit and archive/restore work

### 10. Loads List
- **Route:** `/loads`
- **File:** `app/(app)/loads/page.tsx`
- **Role:** admin, lead
- **Purpose:** View loads at the current location
- **Main sections:** List of `TicketStub` cards, each showing ticket #, status badge, date, customer, product type, door, cases, sorts, billed amount, void/archive buttons
- **Main actions:** Enter a load (link), Void (admin), Archive (admin)
- **Components used:** `TopBar`, `Button`, `TicketStub`, `ConfirmDialog`
- **Data source:** `useAppData().loads`, filtered by `currentLocationId`
- **Empty state:** "No loads at this location yet."
- **Actions functional:** Void and archive work (admin only)
- **Known UX concerns:** `TicketStub` uses old design pattern; no filtering or search on this page (unlike table-based pages)

### 11. Load Entry
- **Route:** `/loads/new`
- **File:** `app/(app)/loads/new/page.tsx`
- **Role:** admin, lead
- **Purpose:** Create a new load
- **Main sections:** Success banner (after save), form card: Customer select, Product type select (cascading), Door number, Container number, Vendor, Date (auto, disabled), PO numbers (dynamic list), Quantities (sorts, cases, weight)
- **Main actions:** Save load → creates load + shows success banner with link to assign crew
- **Components used:** `TopBar`, `Button`, `Card`, `Field`, `Input`, `Select`
- **Data source:** `useAppData().addLoad()` → API
- **Actions functional:** Create works; auto-clears form after save
- **Missing functionality:** No stepper (planned Increment 5); no crew assignment during creation (must do after)

### 12. Load Detail
- **Route:** `/loads/[id]`
- **File:** `app/(app)/loads/[id]/page.tsx`
- **Role:** admin, lead
- **Purpose:** View/edit load details + manage crew assignments
- **Main sections:** Status badge + void/archive buttons, Load details card (door, container, vendor, PO numbers, quantities with billing/payout preview), Crew management card (assigned employees with clock-in/out, add employee dropdown)
- **Main actions:** Save changes (recalculates billing/payout), Add employee, Clock out employee, Void, Archive
- **Components used:** `TopBar`, `Button`, `Card`, `Field`, `Input`, `Select`, `StampBadge`, `ConfirmDialog`
- **Data source:** `useAppData().loads`, `useAppData().employees`, `updateLoad()`, `voidLoad()`, `archiveLoad()`
- **Loading:** No explicit loading; edits are optimistic (local state updates before API)
- **Actions functional:** All work; billing/payout preview recalculates client-side via `calculateLoadAmounts()`
- **Missing functionality:** No validation that clock-out must be after clock-in; clock-in/out uses browser time (not server time)

### 13. Locations List
- **Route:** `/locations`
- **File:** `app/(app)/locations/page.tsx`
- **Role:** admin
- **Purpose:** View warehouse locations as cards
- **Main sections:** Grid of location cards (warehouse icon, name, status pill, code/region, address, shift window)
- **Main actions:** New location (link), click card → edit
- **Components used:** `AdminOnly`, `TopBar`, `Button`, `Card`, `StatusPill`
- **Data source:** `useAppData().locations`
- **Empty state:** "No locations yet. Create your first one."
- **Actions functional:** Links work; cards clickable

### 14. New Location
- **Route:** `/locations/new`
- **File:** `app/(app)/locations/new/page.tsx`
- **Role:** admin
- **Purpose:** Create a new warehouse location
- **Main sections:** Location form (name, region, code, group, address, timezone, status, shift start/end)
- **Components used:** `AdminOnly`, `TopBar`, `Card`, `LocationForm`
- **Actions functional:** Create works

### 15. Edit Location
- **Route:** `/locations/[id]`
- **File:** `app/(app)/locations/[id]/page.tsx`
- **Role:** admin
- **Purpose:** Edit location details
- **Main sections:** Location form (pre-filled)
- **Components used:** `AdminOnly`, `TopBar`, `Card`, `LocationForm`
- **Actions functional:** Edit works (no archive for locations)

### 16. Product Types List
- **Route:** `/product-types`
- **File:** `app/(app)/product-types/page.tsx`
- **Role:** admin
- **Purpose:** View and manage product types with rate cards
- **Main sections:** Filterable table: Name, Customer, Location, Units Billed, Status, Actions
- **Components used:** `AdminOnly`, `TopBar`, `Button`, `Card`, `FilterableTable`, `StampBadge`, `ConfirmDialog`
- **Actions functional:** All CRUD + archive/restore work

### 17. New Product Type
- **Route:** `/product-types/new`
- **File:** `app/(app)/product-types/new/page.tsx`
- **Role:** admin
- **Purpose:** Create a product type with rate card
- **Main sections:** Customer select (cascades locations), Location select, Product type name, Rate card table (unit, bill base/threshold/over-rate, pay threshold/over-rate/bonus)
- **Components used:** `AdminOnly`, `TopBar`, `Card`, `ProductTypeForm`
- **Actions functional:** Create works; rate lines have local draft IDs

### 18. Edit Product Type
- **Route:** `/product-types/[id]`
- **File:** `app/(app)/product-types/[id]/page.tsx`
- **Role:** admin
- **Purpose:** Edit product type + rate card
- **Main sections:** Product type form (pre-filled) + archive/restore
- **Components used:** `AdminOnly`, `TopBar`, `Card`, `ProductTypeForm`, `StampBadge`, `Button`, `ConfirmDialog`
- **Actions functional:** Edit and archive/restore work

### 19. Register User
- **Route:** `/register`
- **File:** `app/(app)/register/page.tsx`
- **Role:** admin
- **Purpose:** Create dashboard user accounts
- **Main sections:** New user form (name, email, password, role select, location with tab toggle), success message, existing users table
- **Main actions:** Create user
- **Components used:** `AdminOnly`, `TopBar`, `Button`, `Card`, `Field`, `Input`, `Select`, `FilterableTable`, `StampBadge`
- **Actions functional:** Create works; "Detect my location" button simulates a 700ms delay

### 20. Load Entry Report
- **Route:** `/reports/load-entry`
- **File:** `app/(app)/reports/load-entry/page.tsx`
- **Role:** admin
- **Purpose:** Report of all loads with filters + CSV export
- **Main sections:** Filterable table (Ticket #, Date, Customer, Location, Product Type, Employees, Cases, Sorts, Billed, Payout, Status) + Export to Excel button
- **Components used:** `AdminOnly`, `TopBar`, `Card`, `FilterableTable`, `StampBadge`
- **Data source:** `useAppData()` — joins loads with customer/location/product-type names
- **Actions functional:** Filtering, sorting, CSV export work; no dedicated print view

### 21. Invoice Report
- **Route:** `/reports/invoice`
- **File:** `app/(app)/reports/invoice/page.tsx`
- **Role:** admin
- **Purpose:** Invoice-ready report of completed loads
- **Main sections:** Filterable table (Ticket #, Date, Customer, Location, Door, Carrier/Vendor, PO #, Cases, Sorts, Billed) + CSV export + total billed summary
- **Components used:** `AdminOnly`, `TopBar`, `Card`, `FilterableTable`
- **Data source:** `useAppData().loads` filtered to `status === 'complete'`
- **Actions functional:** Filtering, sorting, CSV export, total calculation work

---

## 11. Domain Models and TypeScript Types

All types defined in `web/src/lib/types.ts` (mirror `api/src/schemas/domain.ts`).

### Role
```typescript
type Role = "admin" | "lead" | "customer";
```
- `customer` role exists in type but is **not used in any UI logic**

### RecordStatus
```typescript
type RecordStatus = "active" | "archived";
```

### Location
| Field        | Type              | Notes                                  |
| ------------ | ----------------- | -------------------------------------- |
| id           | string            | Primary key                            |
| name         | string            | e.g., "Savannah, GA"                   |
| region       | string            | e.g., "Southeast"                      |
| code         | string \| null    | Short code like "CLT"                  |
| group        | string \| null    | Grouping label                         |
| addressL1    | string \| null    | Street address                         |
| city         | string \| null    |                                        |
| state        | string \| null    |                                        |
| postalCode   | string \| null    |                                        |
| timezone     | string            | e.g., "America/New_York"               |
| status       | string            | (should be RecordStatus but typed as string) |
| shiftStart   | string            | e.g., "08:00"                          |
| shiftEnd     | string            | e.g., "17:00"                          |

### SystemUser
| Field      | Type         | Notes                       |
| ---------- | ------------ | --------------------------- |
| id         | string       |                             |
| name       | string       |                             |
| email      | string       |                             |
| role       | Role         |                             |
| locationId | string       | FK → Location               |
| status     | RecordStatus |                             |

### Customer
| Field            | Type         | Notes                       |
| ---------------- | ------------ | --------------------------- |
| id               | string       |                             |
| contactName      | string       |                             |
| email            | string       |                             |
| phone            | string       |                             |
| displayName      | string       | Shown in app                |
| legalCompanyName | string       |                             |
| locationIds      | string[]     | FK → Location (many-to-many) |
| status           | RecordStatus |                             |

### CrewCategory
```typescript
const CREW_CATEGORY_LABELS = {
  labour: "Labour", operator: "Operator", forklift: "Forklift",
  lead: "Crew Lead", sorter: "Sorter", loader: "Loader",
  checker: "Checker", clerk: "Clerk",
} as const;
type CrewCategory = keyof typeof CREW_CATEGORY_LABELS;
```

### Employee (displayed as "Crew" in UI)
| Field      | Type               | Notes                          |
| ---------- | ------------------ | ------------------------------ |
| id         | string             |                                |
| name       | string             |                                |
| email      | string             |                                |
| phone      | string             |                                |
| address    | string             |                                |
| hourlyRate | number             | For timekeeping clock-ins only |
| category   | CrewCategory \| null | Job type on the floor       |
| locationId | string             | FK → Location                  |
| status     | RecordStatus       |                                |

### RateLine
| Field         | Type   | Notes                              |
| ------------- | ------ | ---------------------------------- |
| id            | string | Unique ID per rate line            |
| unit          | string | e.g., "case", "sort", "lb", "pallet" |
| billBase      | number | Base billing amount                |
| billThreshold | number | Included quantity before overage   |
| billOverRate  | number | Per-unit rate above threshold      |
| payThreshold  | number | Included quantity before overage   |
| payOverRate   | number | Per-unit rate above threshold      |
| payBonus      | number | Flat bonus per unit                |

### ProductType
| Field      | Type         | Notes                                 |
| ---------- | ------------ | ------------------------------------- |
| id         | string       |                                       |
| customerId | string       | FK → Customer                         |
| locationId | string       | FK → Location                         |
| name       | string       | e.g., "Reboxing", "Solar Panel Banding" |
| rateLines  | RateLine[]   | Rate card lines                       |
| status     | RecordStatus |                                       |

### LoadStatus
```typescript
type LoadStatus = "active" | "complete" | "void" | "archived";
```

### LoadEmployeeAssignment
| Field      | Type            | Notes                          |
| ---------- | --------------- | ------------------------------ |
| employeeId | string          | FK → Employee                  |
| clockIn    | string          | Time string (e.g., "06:02")    |
| clockOut   | string \| null  | null = still clocked in        |

### Load
| Field           | Type                      | Notes                                      |
| --------------- | ------------------------- | ------------------------------------------ |
| id              | string                    |                                            |
| ticketNumber    | number                    | Auto-generated by API                      |
| date            | string                    | ISO date string                            |
| locationId      | string                    | FK → Location                              |
| customerId      | string                    | FK → Customer                              |
| productTypeId   | string                    | FK → ProductType                           |
| doorNumber      | string                    |                                            |
| containerNumber | string                    |                                            |
| vendor          | string                    |                                            |
| poNumbers       | string[]                  |                                            |
| sorts           | number                    |                                            |
| cases           | number                    |                                            |
| weight          | number                    |                                            |
| assignments     | LoadEmployeeAssignment[]  | Crew on this load                          |
| status          | LoadStatus                |                                            |
| billedAmount    | number                    | Calculated by API or client-side preview   |
| payoutAmount    | number                    | Calculated by API or client-side preview   |

### Types that exist in API but NOT mirrored in web `types.ts`
- Lead-related types (Lead, LeadAssignment) — not yet implemented in web
- Check-in types — not yet implemented in web

---

## 12. Data Access and Services

### API Client (`lib/api/client.ts`)
- **Exported:** `api` object with `get<T>`, `post<T>`, `patch<T>` methods, `ApiError` class
- **Base URL:** `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:4000`)
- **All paths:** under `/api/v1`
- **Auth:** Bearer token from localStorage attached to every request
- **Error handling:** 401 → clear session + redirect to `/login`; non-2xx → `ApiError` with status + message
- **Replacing with real API:** Already uses real API — no replacement needed

### Data Store (`lib/store.tsx`)
- **Exported:** `AppDataProvider` (context provider), `useAppData()` hook
- **Queries (TanStack Query):**
  | Query Key      | Endpoint            | Return Type     |
  | -------------- | ------------------- | --------------- |
  | `["locations"]` | `GET /locations`    | `Location[]`    |
  | `["customers"]` | `GET /customers`    | `Customer[]`    |
  | `["employees"]` | `GET /employees`    | `Employee[]`    |
  | `["productTypes"]` | `GET /product-types` | `ProductType[]` |
  | `["loads"]`    | `GET /loads`        | `Load[]`        |
  | `["users"]`    | `GET /users`        | `SystemUser[]`  |
- **Mutations (all use `withToast()`):**
  | Method                  | Endpoint                          | Invalidates    |
  | ----------------------- | --------------------------------- | -------------- |
  | `addLocation`           | `POST /locations`                 | locations      |
  | `updateLocation`        | `PATCH /locations/:id`            | locations      |
  | `addUser`               | `POST /users`                     | users          |
  | `addCustomer`           | `POST /customers`                 | customers      |
  | `updateCustomer`        | `PATCH /customers/:id`            | customers      |
  | `toggleCustomerArchive` | `POST /customers/:id/toggle-archive` | customers   |
  | `addEmployee`           | `POST /employees`                 | employees      |
  | `updateEmployee`        | `PATCH /employees/:id`            | employees      |
  | `toggleEmployeeArchive` | `POST /employees/:id/toggle-archive` | employees   |
  | `addProductType`        | `POST /product-types`             | productTypes   |
  | `updateProductType`     | `PATCH /product-types/:id`        | productTypes   |
  | `toggleProductTypeArchive` | `POST /product-types/:id/toggle-archive` | productTypes |
  | `addLoad`               | `POST /loads`                     | loads          |
  | `updateLoad`            | `PATCH /loads/:id`                | loads          |
  | `voidLoad`              | `POST /loads/:id/void`            | loads          |
  | `archiveLoad`           | `POST /loads/:id/archive`         | loads          |

- **Error handling:** `withToast()` catches `ApiError` → `toast.error(message)`; resolves to `undefined` (never rejects)
- **Simulated delay:** None (real API calls)
- **Persistence:** All mutations go through the real API
- **Replacing with mock:** Extremely easy — swap `api.get/post/patch` calls in `store.tsx` with functions returning the mock data arrays

### Billing (`lib/billing.ts`)
- **Exported:** `calculateLoadAmounts(rateLines, quantities)` → `{ billed, payout }`
- **Pure function:** No API calls, no side effects
- **Used in:** `loads/[id]/page.tsx` (billing preview) and by the API (`api/src/lib/billing.ts`)

### CSV (`lib/csv.ts`)
- **Exported:** `downloadCsv(filename, columns, rows)`
- **Pure client-side:** Creates Blob, triggers download
- **Used in:** `reports/load-entry/page.tsx`, `reports/invoice/page.tsx`

### Mock Data (`lib/mock-data.ts`)
- **Exports:** `LOCATIONS`, `CUSTOMERS`, `EMPLOYEES`, `PRODUCT_TYPES`, `LOADS`, `SYSTEM_USERS`
- **Used in:** **Nowhere** — not imported by any file
- **Record counts:** 3 locations, 4 customers, 7 employees, 6 product types, 7 loads, 3 system users
- **Status:** Leftover from early development; kept in sync with seed data conceptually but may be stale

---

## 13. Mock Data

### File: `web/src/lib/mock-data.ts`

**Status: UNUSED** — no component or service imports this file. It is a leftover artifact.

**Entities represented:**
| Export          | Count | Realistic? | Notes                                           |
| --------------- | ----- | ---------- | ----------------------------------------------- |
| `LOCATIONS`     | 3     | Yes        | Savannah GA, Charlotte NC, Dallas TX — but missing many fields (no code, group, address, timezone, shift fields) |
| `CUSTOMERS`     | 4     | Yes        | 3 active, 1 archived; realistic company names   |
| `EMPLOYEES`     | 7     | Yes        | 6 active, 1 archived; realistic names + rates — but missing the `category` field (added later to the real model) |
| `PRODUCT_TYPES` | 6     | Yes        | 5 active, 1 archived; realistic rate cards — but the `locationId` field is inconsistent with current API schema |
| `LOADS`         | 7     | Yes        | Mix of active, complete, void, archived; crew assignments with clock-in/out |
| `SYSTEM_USERS`  | 3     | Yes        | 1 admin, 1 lead, 1 customer; matches seed data |

**IDs and relationships:** Consistent within the file (location IDs, customer IDs, employee IDs match across entities).

**Persistence:** Not used at runtime. If it were used, mutations would not persist after reload (static arrays).

**Missing edge cases:** No zero-quantity loads, no loads without assignments, no customers without locations.

**Direct mock imports:** None found. All components use `useAppData()`.

---

## 14. State Management and Data Fetching

### Global state
- **Auth state:** `AuthContext` (`lib/auth.tsx`) — user object, status ("loading" | "authenticated" | "unauthenticated"), login/logout functions
- **App data:** `AppDataContext` (`lib/store.tsx`) — all entity lists, `isLoading`, `currentLocationId`, all mutation functions, `role`

### Local component state
- All forms use local `useState` for form values
- `currentLocationId` stored in `AppDataProvider` state (survives navigation, resets on reload)
- Modal/dialog open/close state is local to each page
- Filter/search state is local to `FilterableTable`

### Context providers (nesting order)
1. `QueryClientProvider` (TanStack Query)
2. `AuthProvider`
3. (Inside `(app)/layout.tsx`) `AppDataProvider`

### Query cache
- TanStack Query with configured defaults: `staleTime: 30_000`, `refetchOnWindowFocus: false`, `retry: 1`
- Cache keyed by entity name arrays (e.g., `["customers"]`)
- Mutations invalidate the relevant query key after success
- Logout clears entire query cache

### Custom hooks
| Hook          | File               | Purpose                              |
| ------------- | ------------------ | ------------------------------------ |
| `useAuth()`   | `lib/auth.tsx`      | Access auth state + login/logout     |
| `useAppData()`| `lib/store.tsx`     | Access all entity data + mutations   |

### URL-based state: None. All state is in React context + local state. No URL query params used for filters, pagination, or selected location.

### Filter state
- `FilterableTable` manages its own state: search text, active filters (key + value), sort column/direction
- All filtering and sorting is **client-side** on the already-fetched data

### Pagination state: None. No pagination implemented.

### Form state: Local `useState` per form. No form library.

### Persistent state
- Auth token + user object: localStorage (survives reload)
- `currentLocationId`: React state only (resets on reload)

### Duplication concerns
- `role` is available from both `useAuth().user.role` and `useAppData().role` — the latter is derived from the former with a fallback to "admin"

---

## 15. Forms and Validation

### Forms inventory

| Form | Screen | File | Library | Validation | Persists? |
| ---- | ------ | ---- | ------- | ---------- | --------- |
| Login | `/login` | `login/page.tsx` | None (controlled inputs) | Manual: checks email + password non-empty | Yes (API) |
| Forgot Password | `/forgot-password` | `forgot-password/page.tsx` | None | Manual: 6-digit code, min 8 char password, match confirm | **No** (mock) |
| Customer | `/customers/new`, `/customers/[id]` | `forms/CustomerForm.tsx` | None | HTML5 `required` on some fields; `displayName` required | Yes (API) |
| Employee (Crew) | `/crew/new`, `/crew/[id]` | `forms/EmployeeForm.tsx` | None | HTML5 `required` on name, email, location; no rate validation | Yes (API) |
| Location | `/locations/new`, `/locations/[id]` | `forms/LocationForm.tsx` | None | HTML5 `required` on name, region; defaults for timezone, status, shift | Yes (API) |
| Product Type | `/product-types/new`, `/product-types/[id]` | `forms/ProductTypeForm.tsx` | None | Manual check: customerId + locationId + name required | Yes (API) |
| Load Entry | `/loads/new` | `loads/new/page.tsx` | None | Manual check: customerId + productTypeId required | Yes (API) |
| Load Detail | `/loads/[id]` | `loads/[id]/page.tsx` | None | None (quantities default to 0) | Yes (API) |
| Register User | `/register` | `register/page.tsx` | None | Manual check: name, email, password, locationId required | Yes (API) |

### Common patterns
- All forms use controlled inputs with `useState`
- No form library (no React Hook Form, Formik, etc.)
- No schema validation library (no Zod, Yup, etc.)
- Error display: Login shows inline error banner; mutations show toast errors; form-level validation uses browser `required` attribute
- No unsaved-change protection
- No accessibility features beyond native HTML form controls

---

## 16. Tables, Filters, Search, Sorting, and Pagination

### Table implementations

| Screen | Columns | Row Actions | Bulk Actions | Search | Filters | Sorting | Pagination | Data Source |
| ------ | ------- | ----------- | ------------ | ------ | ------- | ------- | ---------- | ----------- |
| Customers | Display Name, Legal Name, Contact, Locations, Status, Actions | Edit, Archive/Restore | None | Free text across all columns | Status (select), add any column | Click header (asc/desc/none) | None | `useAppData().customers` |
| Crew | Name, Contact, Category, Location, Hourly Rate, Status, Actions | Edit, Archive/Restore | None | Free text | Status, Category, Location (select) | Click header | None | `useAppData().employees` |
| Product Types | Name, Customer, Location, Units Billed, Status, Actions | Edit, Archive/Restore | None | Free text | Customer, Location, Status (select) | Click header | None | `useAppData().productTypes` |
| Register Users | Name, Email, Role, Location, Status | None | None | Free text | Role, Status, Location (select) | Click header | None | `useAppData().users` |
| Load Entry Report | Ticket #, Date, Customer, Location, Product Type, Employees, Cases, Sorts, Billed, Payout, Status | None | CSV Export | Free text | Customer, Location, Status (select) | Click header | None | `useAppData().loads` (joined) |
| Invoice Report | Ticket #, Date, Customer, Location, Door, Carrier, PO #, Cases, Sorts, Billed | None | CSV Export | Free text | Customer, Location (select) | Click header | None | `useAppData().loads` (completed only) |
| Loads | Ticket stub cards (not a table) | Void, Archive (admin) | None | None | None | Sorted by ticket# desc | None | `useAppData().loads` |

### Filtering and pagination
- **All filtering is client-side** — the entire dataset is fetched once, then filtered in `useMemo`
- **No pagination** — all records shown at once
- Search is a free-text search across all filterable columns
- Filter chips support "text" (substring match) and "select" (exact match) modes
- Filters and sort state are local to `FilterableTable`

### Mobile behavior
- Tables use `overflow-x-auto` for horizontal scrolling
- No responsive column hiding or card-based mobile layout

### Empty state
- "No rows match these filters." inside table body
- Loads list: "No loads at this location yet."

### Loading state
- No explicit loading state for tables (no skeleton, no spinner)

---

## 17. Styling and Responsiveness

### Global styles (`app/globals.css`)
- Tailwind CSS v4 via `@import "tailwindcss"`
- CSS custom properties (design tokens) declared in `:root`
- `@theme inline` block maps custom properties to Tailwind theme
- Custom utility classes: `.stub-perforation` (perforated edge for TicketStub), `.ink-stamp` (outlined status badge)
- `prefers-reduced-motion` support (disables animations/transitions)

### Tailwind configuration
- No `tailwind.config.ts` — using Tailwind v4 CSS-based configuration (`@theme inline`)
- All theme tokens mapped via CSS custom properties
- Default Tailwind breakpoints used

### Styling patterns
- Tailwind utility classes exclusively (no CSS modules, no styled-components)
- Custom design tokens for colors, fonts, shadows
- No separate theme file (all in `globals.css` + component-level classes)

### Desktop behavior: Primary target. Sidebar + content layout.

### Tablet behavior: Some `sm:` breakpoints used (form grids go from 1-col to 2-col). No specific tablet layout.

### Mobile behavior: **Not explicitly supported.** Most pages work reasonably at narrow widths (tables scroll horizontally, forms stack). The sidebar is always visible (no hamburger menu, no collapse).

### Known issues
- Sidebar is fixed width with no collapse — wastes space on small screens
- Tables overflow horizontally with no alternative mobile layout
- Login page has a split-panel design that stacks on mobile (functional but not polished)
- No responsive navigation for mobile

---

## 18. Utilities and Helpers

| Utility | File | Purpose | Main Consumers |
| ------- | ---- | ------- | -------------- |
| `calculateLoadAmounts()` | `lib/billing.ts` | Compute billed + payout from rate lines + quantities | Load detail page, API billing |
| `downloadCsv()` | `lib/csv.ts` | Trigger CSV file download from data | Report pages |
| `getToken()` | `lib/token.ts` | Read JWT from localStorage | API client, auth provider |
| `getStoredUser()` | `lib/token.ts` | Read user object from localStorage | Auth provider |
| `storeSession()` | `lib/token.ts` | Write token + user to localStorage | Auth provider |
| `clearSession()` | `lib/token.ts` | Remove token + user from localStorage | Auth provider, API client (on 401) |
| `withToast()` | `lib/store.tsx` | Wrap mutation with success/error toast | All mutations in store |
| `customerBody()` | `lib/store.tsx` | Shape request body for customer API | Customer mutations |
| `employeeBody()` | `lib/store.tsx` | Shape request body for employee API | Employee mutations |
| `locationBody()` | `lib/store.tsx` | Shape request body for location API | Location mutations |
| `productTypeBody()` | `lib/store.tsx` | Shape request body for product type API | Product type mutations |
| `loadBody()` | `lib/store.tsx` | Shape request body for load API | Load mutations |
| `stripRateLineIds()` | `lib/store.tsx` | Remove draft IDs from rate lines before sending | Product type mutations |

### No dedicated utilities for:
- Currency formatting (uses `$…toFixed(2)` inline)
- Date formatting (uses string slicing e.g., `date.slice(0, 10)`, `date.slice(5)`)
- Number formatting (uses inline `toLocaleString()` in charts)
- Status mapping (handled by `StampBadge` component config)
- Class name utilities (Tailwind only)
- ID generation (uses counter-based draft IDs in forms)
- Storage helpers (only auth-related, in `token.ts`)

---

## 19. Configuration

### package.json scripts
| Script   | Command                    | Purpose                              |
| -------- | -------------------------- | ------------------------------------ |
| `dev`    | `next dev`                 | Development server                   |
| `build`  | `next build`               | Production build                     |
| `start`  | `next start`               | Production server                    |
| `lint`   | `biome check`              | Lint + format check (Biome)          |
| `format` | `biome format --write`     | Auto-format (Biome)                  |

### TypeScript config (`tsconfig.json`)
- Target: ES2017
- Strict mode: true
- No emit: true (Next.js handles compilation)
- Path alias: `@/*` → `./src/*`
- Module resolution: bundler
- JSX: react-jsx
- Incremental: true
- Next.js plugin enabled

### Next.js config (`next.config.ts`)
- React Compiler: enabled (`reactCompiler: true`)
- No other custom configuration

### Biome config (`biome.json`)
- Version: 2.2.0
- Indent: 2 spaces
- Organize imports: on
- Lint domains: next (recommended), react (recommended)
- Rules: `noUnknownAtRules` off (for Tailwind v4 `@theme` directive)

### PostCSS config (`postcss.config.mjs`)
- Plugin: `@tailwindcss/postcss`

### Path aliases
- `@/*` → `./src/*` (configured in `tsconfig.json`)

### Environment variables
- `NEXT_PUBLIC_API_URL` — API base URL (default: `http://localhost:4000`). Read in `lib/api/client.ts`. A `.env.local` file likely exists pointing to localhost.

### Public assets
- `public/assets/warehouse.svg` — used on login page background
- `public/assets/warehouse-123.svg` — alternate illustration
- `public/assets/forklift.svg` — present but not referenced in code

### Build output: `.next/` (standard Next.js)

### Development server: `localhost:3000` (Next.js default)

---

## 20. Testing

**No testing infrastructure exists.**

- **Testing framework:** None (no Jest, Vitest, etc.)
- **Test setup:** None
- **Unit tests:** None
- **Component tests:** None
- **Integration tests:** None
- **End-to-end tests:** None
- **Coverage configuration:** None

### What has no tests
Everything. The entire frontend has zero automated tests. All quality relies on TypeScript type-checking (`npx tsc --noEmit`), Biome linting, and manual testing.

---

## 21. Current Functional Workflows

### 1. Login → Dashboard
1. Visit `/login`
2. Enter email + password (demo: `rick@dockmaster3pl.com` / `1234`)
3. API call to `POST /auth/login`
4. Token + user stored in localStorage
5. Redirect to `/`
6. Dashboard loads with location-scoped data
**Status:** Fully functional

### 2. Load Entry → Crew Assignment
1. Navigate to `/loads/new`
2. Select Customer → cascades Product Types for that customer at current location
3. Select Product Type, fill door, container, vendor, PO numbers, quantities
4. Submit → API creates load, returns ticket number
5. Success banner links to `/loads/[id]`
6. On load detail page, add employees (clock-in auto-set to current time), clock them out
7. Billing/payout preview updates live as quantities change
8. Save writes changes to API
**Status:** Fully functional (minus stepper, planned for Increment 5)

### 3. Customer Management
1. `/customers` → view list with filters
2. `/customers/new` → create customer with location assignment
3. `/customers/[id]` → edit details, archive/restore
**Status:** Fully functional

### 4. Crew Management
1. `/crew` → view list with filters (category, location, status)
2. `/crew/new` → create crew member with category selection
3. `/crew/[id]` → edit details, archive/restore
**Status:** Fully functional

### 5. Location Management
1. `/locations` → view location cards
2. `/locations/new` → create location
3. `/locations/[id]` → edit location details
**Status:** Fully functional (no archive for locations)

### 6. Product Type Management
1. `/product-types` → view list with filters
2. `/product-types/new` → create with rate card (multi-line bill/pay table)
3. `/product-types/[id]` → edit rate card, archive/restore
**Status:** Fully functional

### 7. User Registration
1. `/register` → admin creates new user (name, email, password, role, location)
2. User appears in existing users table
**Status:** Fully functional

### 8. Reporting
1. `/reports/load-entry` → filterable table of all loads + CSV export
2. `/reports/invoice` → completed loads only + total billed + CSV export
**Status:** Fully functional

### 9. Forgot Password
1. `/forgot-password` → 5-step wizard
2. **None of it calls the API** — purely decorative
**Status: Placeholder/mock**

---

## 22. Incomplete, Placeholder, and Dead Code

### Placeholder pages
- `app/forgot-password/page.tsx` — 5-step wizard with no API calls; entire flow is local UI state

### Non-functional buttons/controls
- Login "Remember me" checkbox — toggles state but never read or used
- Forgot Password entire wizard — no actual password reset

### TODO comments: None found in the codebase.

### Commented-out code: None found.

### Hardcoded values
- `NEXT_PUBLIC_API_URL` fallback: `http://localhost:4000` in `api/client.ts`
- Login page feature list describes AI features not yet built
- ProductTypeForm draft rate line IDs use a module-level counter (`rlCounter`)
- Load entry PO number IDs use a module-level counter (`poCounter`)

### Duplicate components
- `StampBadge` vs `StatusPill` — both display status but with different visual styles; no clear rule on which to use where

### Unused files
- `lib/mock-data.ts` — not imported anywhere
- `public/assets/forklift.svg` — not referenced in any component
- `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` — Next.js boilerplate, unused
- `src/assets/warehouse.svg` — duplicate of `public/assets/warehouse.svg`

### Unused dependencies
- `@tanstack/react-query-devtools` — imported in `providers.tsx` but devtools not rendered (no `<ReactQueryDevtools />` in the component tree)

### Abandoned implementations
- `TicketStub` component — old design pattern; PLANNED for retirement in Increment 4 but still in use on loads page
- `StampBadge` — partially replaced by `StatusPill` but still widely used

### Routes without working screens: None (all routes have functional pages).

### Screens without services: Forgot Password (no API integration).

### Services without screens: None — all store mutations have corresponding UI.

### Components importing fake data directly: None (all use `useAppData()`).

---

## 23. Known Technical Risks

### Tight coupling
- `AppDataProvider` (`lib/store.tsx`) is a 490-line file containing all queries, all mutations, all request body shaping, and business logic — single point of change for any entity
- Every page depends on `useAppData()` which provides the entire dataset (e.g., loads page gets all customers, employees, product types, etc. even if only loads are displayed)

### Duplicate types
- `LocationFormValues` in `LocationForm.tsx` duplicates fields from `types.ts` Location type but as a separate type (not derived)
- `CustomerFormValues` similarly duplicates Customer fields

### Business calculations inside components
- `calculateLoadAmounts()` is properly extracted to `lib/billing.ts` ✅
- BUT the load detail page also has business logic for determining status: `allClockedOut ? "complete" : …` — this status transition logic is duplicated in the UI

### Direct mock imports: None (mock-data.ts is unused). ✅

### Missing error boundaries
- No `<ErrorBoundary>` component anywhere in the app
- If a page throws during render, the entire app crashes to Next.js default error overlay

### Missing validation
- Most forms rely on HTML5 `required` attribute only
- No client-side validation for:
  - Email format
  - Phone format
  - Hourly rate (accepts negative numbers)
  - Quantities (accepts negative numbers)
  - Rate card amounts (no min/max)
  - Clock-out time must be after clock-in

### Missing accessibility
- No ARIA labels on most interactive elements
- `Field` component uses `<label>` without explicit `htmlFor` (relies on implicit nesting — Biome suppressed warning)
- No keyboard navigation testing
- No focus management for modals
- No screen reader testing

### Large components
- `FilterableTable.tsx` — 277 lines (search, filter, sort, table rendering all in one component)
- `store.tsx` — 490 lines (all queries + mutations + helpers in one file)
- `ProductTypeForm.tsx` — 296 lines (form + rate card table inline)
- `forgot-password/page.tsx` — 239 lines (5-step wizard in a single component)

### Inconsistent status values
- `Location.status` is typed as `string` in `types.ts` (not `RecordStatus`)
- `StatusPill` has 5 tones but there's no mapping from entity statuses to tones (done ad-hoc per usage)

### Fragile route logic
- `Sidebar.tsx` determines active route by checking `pathname.startsWith(href + '/')` — fragile if routes change
- 401 redirect uses `window.location.assign` (hard page reload) instead of Next.js `router.replace`

### Hardcoded permissions
- Role checks are inline: `role === "admin"` scattered across pages
- `AdminOnly` component provides some centralization but not all admin checks use it

### localStorage limitations
- Synchronous API, no encryption, size limit (5-10MB)
- Token stored in plaintext
- No session expiry handled (API may reject expired tokens → 401 → redirect)

### Lack of test coverage: 0% test coverage across the entire frontend.

### Poor mobile support: Sidebar always visible, no responsive navigation, tables overflow horizontally.

---

## 24. Recommended Extension Points

### Planned modules and how they connect

#### 1. Completed Load Detail and Financial Summary
- **Existing types to reuse:** `Load`, `LoadEmployeeAssignment`, `Employee`, `ProductType`, `RateLine`, `Customer`, `Location`
- **Existing components to reuse:** `TopBar`, `Card`, `StatCard`, `StampBadge`, `StatusPill`, `Button`, `Field`
- **Existing routes:** `/loads/[id]` (can be extended)
- **Existing services:** `useAppData().loads`, `employees`, `productTypes`, `customers`, `locations`
- **Missing domain types:** None (all exist)
- **Missing service methods:** Possibly `GET /loads/:id/financial-summary` if detailed breakdown needed beyond current Load type
- **Recommended folder:** `app/(app)/loads/[id]/` (extend existing)
- **Architectural risks:** Avoid adding more business logic to the page component; extract financial calculations to `lib/billing.ts`

#### 2. Payroll List and Employee Payroll Breakdown
- **Existing types to reuse:** `Employee`, `LoadEmployeeAssignment`, `Load`, `ProductType`, `RateLine`
- **Existing components to reuse:** `TopBar`, `Card`, `FilterableTable`, `StatusPill`
- **Existing routes:** None (new)
- **Existing services:** `useAppData().employees`, `loads`
- **Missing domain types:** Payroll line item (hours worked, hourly pay, production pay, total payout)
- **Missing service methods:** `GET /payroll`, `GET /payroll/:employeeId` (API endpoints don't exist yet)
- **Recommended folder:** `app/(app)/payroll/` (new)
- **Architectural risks:** Payroll calculations should live in the API, not the client; client should only display

#### 3. Unbilled Loads and Customer Billing Queue
- **Existing types to reuse:** `Load` (filtered by status + billing status)
- **Existing components to reuse:** `TopBar`, `Card`, `FilterableTable`, `Button`, `ConfirmDialog`
- **Existing routes:** None (new)
- **Existing services:** `useAppData().loads` (filtered client-side or new endpoint)
- **Missing domain types:** Invoice, billing status enum
- **Missing service methods:** `GET /billing/queue`, `POST /billing/invoice`
- **Recommended folder:** `app/(app)/billing/` (new)
- **Architectural risks:** Billing state transitions should be server-driven

#### 4. Invoice Builder with Live Preview
- **Existing types to reuse:** `Customer`, `Load`, `ProductType`, `Location`
- **Existing components to reuse:** `TopBar`, `Card`, `Button`, `Field`, `FilterableTable`
- **Existing routes:** `/reports/invoice` (read-only report; invoice builder is a new interactive feature)
- **Missing domain types:** Invoice (header + line items), invoice status
- **Missing service methods:** Full invoice CRUD API
- **Recommended folder:** `app/(app)/invoices/` (new)
- **Architectural risks:** Keep preview calculation on client (reuse `calculateLoadAmounts`) but final invoice generation on server

#### 5. Invoice List and Invoice Detail
- **Existing types to reuse:** `Customer`, `Load` (as line items)
- **Existing components to reuse:** `TopBar`, `Card`, `FilterableTable`, `StampBadge`, `Button`
- **Existing routes:** None (new)
- **Recommended folder:** `app/(app)/invoices/` (alongside invoice builder)

#### 6. Financial Dashboard
- **Existing types to reuse:** `Load`, `Customer`, `Location`
- **Existing components to reuse:** `TopBar`, `Card`, `StatCard`, `DashboardCharts` (can add new chart types)
- **Existing routes:** `/` (dashboard; can add financial section)
- **Recommended folder:** `app/(app)/` (extend dashboard) + new chart components in `components/`
- **Architectural risks:** Use API-driven aggregation rather than client-side number crunching

### General extension patterns
- **New CRUD entity:** Create `app/(app)/entity-name/` with `page.tsx` (list), `new/page.tsx`, `[id]/page.tsx`; add types to `types.ts`; add queries + mutations to `store.tsx`; add form component in `components/forms/`; add button/link to `Sidebar.tsx`
- **New report:** Create `app/(app)/reports/report-name/page.tsx`; reuse `FilterableTable` + `downloadCsv`; wrap in `AdminOnly`
- **New shared component:** Add to `components/ui/` (if primitive) or `components/` (if domain-specific)

---

## 25. Suggested Development Order

Based on the current codebase state and dependencies between planned modules:

1. **Payroll List and Employee Payroll Breakdown** — Depends only on existing Load + Employee data; requires new API endpoints but no new UI patterns. Tests the "report → detail" drill-down pattern.

2. **Completed Load Detail and Financial Summary** — Extends existing `/loads/[id]` page with financial breakdown; low risk, reuses existing infrastructure.

3. **Unbilled Loads and Customer Billing Queue** — Introduces the concept of "billing status" (distinct from load status). Depends on loads being completed (which already works). Requires new API state machine for billing.

4. **Invoice Builder with Live Preview** — Depends on billing queue (module 3). Most complex module — needs invoice header + line items + live calculation + preview.

5. **Invoice List and Invoice Detail** — Depends on invoice builder (module 4). Straightforward CRUD once invoice model exists.

6. **Financial Dashboard** — Depends on invoices + payroll being functional (modules 1-5). Aggregation of data already captured.

**Rationale:** Modules 1-2 are self-contained extensions of existing patterns. Modules 3-5 form a dependency chain (billing queue → invoice builder → invoice list). Module 6 is the capstone requiring all prior data.

---

## 26. Important File Reference

1. `web/src/lib/types.ts` — All domain types; source of truth for the frontend (mirrors API schemas)
2. `web/src/lib/store.tsx` — Central data store: all TanStack Query fetches + mutations + request body shaping
3. `web/src/lib/api/client.ts` — API client: fetch wrapper with auth, error handling, 401 redirect
4. `web/src/lib/auth.tsx` — Authentication context: login, logout, session restore
5. `web/src/app/(app)/layout.tsx` — Authenticated app shell: auth guard, sidebar, AppDataProvider nesting
6. `web/src/app/globals.css` — All design tokens (colors, fonts, shadows) and Tailwind v4 theme
7. `web/src/components/FilterableTable.tsx` — Core data display component used by 6+ pages
8. `web/src/components/Sidebar.tsx` — Navigation structure and role-based visibility logic
9. `web/src/components/TopBar.tsx` — Page header pattern used by every authenticated page
10. `web/src/app/(app)/page.tsx` — Dashboard: most complex page, shows how data is composed
11. `web/src/components/ui/Button.tsx` — Button primitive with all variant classes
12. `web/src/components/ui/Field.tsx` — Form field pattern (Input, Select, Textarea)
13. `web/src/lib/billing.ts` — Billing/payout calculation (shared between client preview and API)
14. `web/src/app/login/page.tsx` — Login page: auth flow, public page pattern (diverges from app shell)
15. `web/package.json` — Dependencies, scripts, project metadata
16. `api/src/schemas/domain.ts` — API TypeBox schemas; must be kept in sync with `web/src/lib/types.ts`
17. `AGENTS.md` — Coding conventions, architecture rules, forbidden actions
18. `PLAN.md` — Feature roadmap, phase status, client decisions