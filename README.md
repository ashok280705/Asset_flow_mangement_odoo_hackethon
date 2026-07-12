# AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is a centralized ERP platform for tracking, allocating, and maintaining an
organization's physical assets and shared resources. It replaces spreadsheets and paper
logs with structured asset lifecycles, conflict-free resource booking, approval-driven
maintenance, and scheduled audit cycles — with real-time visibility into **who holds
what, where it is, and its condition**.

It is industry-agnostic: any organization with equipment, furniture, vehicles, or shared
spaces (offices, schools, hospitals, factories, agencies) can use it. AssetFlow
deliberately stays out of purchasing, invoicing, and accounting.

---

## Table of contents

- [Highlights](#highlights)
- [Roles & access control](#roles--access-control)
- [Feature coverage](#feature-coverage)
- [Core workflows](#core-workflows)
- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [API surface](#api-surface)
- [Project structure](#project-structure)
- [Design system](#design-system)

---

## Highlights

- **Secure, non-self-elevating accounts** — signup creates an *Employee* only. Roles are
  assigned exclusively by an Admin in Organization Setup.
- **Strict role-based data scoping** — every list and metric is filtered server-side by
  role: employees see only what is allocated to them, department heads see only their
  department, managers/admins see the whole organization. Scoping cannot be bypassed from
  the client.
- **Conflict-safe operations** — an asset can never be double-allocated, and shared
  resources can never be double-booked (time-slot overlap validation).
- **Approval-driven workflows** — maintenance requests and asset transfers move through
  explicit approval states before anything changes; transfers atomically re-allocate the
  asset and update history.
- **Full audit trail & notifications** — every meaningful action writes an activity log
  and notifies the relevant users (assignment, approval/rejection, transfer, booking,
  overdue return, audit discrepancy).
- **Premium, responsive UI** — a bento-style KPI dashboard, command palette (`⌘/Ctrl-K`),
  skeleton loaders, timeline activity feed, and accessible, keyboard-navigable components.

---

## Roles & access control

Roles are assigned only by an Admin (Organization Setup → Employee Directory). Access is
enforced **server-side** in [`src/lib/rbac.ts`](src/lib/rbac.ts) and mirrored in the UI so
users never see actions they cannot perform.

| Capability | Admin | Asset Manager | Department Head | Employee |
| --- | :---: | :---: | :---: | :---: |
| View all assets | ✅ | ✅ | Dept only | Own only |
| Register assets | ✅ | ✅ | — | — |
| Allocate assets | ✅ | ✅ | ✅ (dept) | — |
| Approve transfers | ✅ | ✅ | ✅ (dept) | — |
| Approve maintenance | ✅ | ✅ | — | — |
| Raise maintenance / book resources | ✅ | ✅ | ✅ | ✅ |
| Return / request transfer | ✅ | ✅ | ✅ | ✅ (own) |
| Run & close audit cycles | ✅ | ✅ | — | — |
| Record audit findings | ✅ | ✅ | — | ✅ (if assigned auditor) |
| Organization Setup (departments, categories, roles) | ✅ | — | — | — |
| Reports & analytics | ✅ | ✅ | ✅ | — |

**How scoping works:** each read endpoint composes a Prisma `where` from `rbac.ts`
(`assetScope`, `allocationScope`, `maintenanceScope`, …) *before* applying any user
filter, using `AND` so a query parameter can never widen a user's visibility. The
dashboard KPIs are scoped the same way, so every role gets an accurate snapshot of *their*
world.

---

## Feature coverage

Mapped directly to the problem statement:

1. **Login / Signup** — email + password auth (JWT, httpOnly cookie, bcrypt hashing),
   session validation. Signup creates an Employee; roles are promoted by an Admin only.
2. **Dashboard** — KPI cards (Available, Allocated, In Maintenance, Active Allocations,
   Overdue Returns, Pending Maintenance, Upcoming Bookings, Pending Transfers, Upcoming
   Returns), utilization & fleet-health rings, status/category distribution, a timeline
   activity feed, a "needs attention" panel, and role-aware quick actions.
3. **Organization Setup (Admin)** — three tabs: Departments (with hierarchy & status),
   Asset Categories (with optional warranty period), and the Employee Directory (the only
   place roles are assigned).
4. **Asset Registration & Directory** — auto-generated asset tags (`AF-0001`), serial
   number, acquisition date/cost, condition, location, bookable flag; search & filter;
   per-asset lifecycle status and allocation/maintenance history.
5. **Allocation & Transfer** — allocate with an expected return date; the conflict rule
   blocks double-allocation and surfaces the current holder with a **Request Transfer**
   action; the transfer workflow (Requested → Approved → Re-allocated) updates history
   automatically; returns capture condition check-in notes and revert the asset to
   Available; overdue allocations are flagged.
6. **Resource Booking** — time-slot booking for shared resources with overlap validation;
   Upcoming / Ongoing / Completed / Cancelled statuses.
7. **Maintenance** — raise → Approved/Rejected → Technician Assigned → In Progress →
   Resolved; the asset auto-flips to Under Maintenance on approval and back to Available on
   resolution; history retained per asset.
8. **Audit Cycles** — create a cycle (department/location scope, date range), assign
   auditors, record Verified / Missing / Damaged per asset, auto-generate a discrepancy
   report, and close the cycle (locks it and reconciles asset state — confirmed-missing →
   Lost, damaged → condition Damaged).
9. **Reports & Analytics** — asset distribution by status/category/department, maintenance
   by priority, allocation breakdown (manager surface).
10. **Activity Logs & Notifications** — a full "who did what, when" log and per-user
    notifications for every key event.

---

## Core workflows

**Allocation conflict → transfer.** If a manager tries to allocate an asset that is already
held, the API returns `409` with the holder's name and a `conflict` flag. The UI then
offers *Request Transfer instead*, which files a `TransferRequest`. An approver actions it
from the Allocations screen; on approval the asset is atomically returned from the current
holder, re-allocated to the requester, and the requester is notified.

**Maintenance approval.** Anyone can raise a request; only managers advance it. Approval
moves the asset to Under Maintenance; resolution (or rejection) returns it to Available.
The raiser is notified at each transition.

**Booking overlap.** A booking for `9:30–10:30` against an existing `9:00–10:00` slot is
rejected; `10:00–11:00` is accepted because it starts exactly when the previous one ends.

**Audit close.** Closing a cycle locks it and updates affected assets in a single
transaction, then produces a discrepancy report and notifies managers.

---

## Tech stack

- **Framework:** Next.js (App Router) + React 19, TypeScript
- **Styling:** Tailwind CSS v4 with a custom warm-neutral + emerald design system
- **Database:** MySQL via Prisma ORM
- **Auth:** JWT (httpOnly cookie) + bcrypt
- **Validation:** Zod
- **Charts / icons:** Recharts · Lucide

---

## Data model

Prisma schema: [`prisma/schema.prisma`](prisma/schema.prisma).

```
User ── Department (many users per department, optional department head + hierarchy)
Asset ── AssetCategory, Department
Allocation      Asset ↔ User   (ACTIVE / RETURNED / OVERDUE, condition in/out, expected return)
TransferRequest Asset ↔ User   (PENDING / APPROVED / REJECTED)
Booking         Asset ↔ User   (UPCOMING / ONGOING / COMPLETED / CANCELLED, time slot)
MaintenanceRequest Asset ↔ User (PENDING → … → RESOLVED, priority, technician)
AuditCycle ── AuditAssignment (auditors) ── AuditItem (VERIFIED / MISSING / DAMAGED)
Notification, ActivityLog  (per-user feeds + org-wide audit trail)
```

Asset lifecycle states: `AVAILABLE · ALLOCATED · RESERVED · UNDER_MAINTENANCE · LOST ·
RETIRED · DISPOSED`.

---

## Getting started

### Prerequisites

- Node.js 20+
- A MySQL 8 database

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL="mysql://user:password@localhost:3306/assetflow"
JWT_SECRET="a-long-random-secret"
NEXTAUTH_SECRET="another-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
npx prisma generate       # generate the Prisma client
npx prisma db push        # create the schema in your database
npx prisma db seed        # load demo departments, categories, users & assets
```

### 4. Run

```bash
npm run dev               # http://localhost:3000
```

For a production build: `npm run build && npm run start`.

---

## Demo accounts

Seeded by `prisma/seed.ts`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@assetflow.com` | `Admin@123` |
| Asset Manager | `manager@assetflow.com` | `Manager@123` |
| Department Head | `head@assetflow.com` | `Head@123` |
| Employee | `emp1@assetflow.com` | `Employee@123` |
| Employee | `emp2@assetflow.com` | `Employee@123` |

Log in as different roles to see the access model in action — e.g. `emp1` sees only their
allocated asset, while `admin` sees the whole fleet.

---

## API surface

All routes live under `src/app/api` and require a valid session; mutating routes enforce
role checks.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/{signup,login,logout}` · `GET /api/auth/me` |
| Assets | `GET/POST /api/assets` · `GET /api/assets/:id` |
| Allocations | `GET/POST /api/allocations` · `PATCH /api/allocations/:id/return` |
| Transfers | `GET/POST /api/transfers` · `PATCH /api/transfers/:id` |
| Bookings | `GET/POST /api/bookings` · `PATCH /api/bookings/:id` |
| Maintenance | `GET/POST /api/maintenance` · `PATCH /api/maintenance/:id` |
| Audits | `GET/POST /api/audits` · `GET/POST /api/audits/:id/items` · `PATCH /api/audits/:id/close` |
| Setup | `GET/POST /api/departments` · `GET/POST /api/categories` · `GET /api/employees` · `PATCH /api/employees/:id/role` |
| Insights | `GET /api/dashboard/stats` · `GET /api/reports/assets` · `GET /api/activity-logs` · `GET /api/notifications` |

---

## Project structure

```
src/
├── app/
│   ├── (auth)/            # login & signup (public)
│   ├── (dashboard)/       # authenticated app shell + feature screens
│   └── api/               # REST route handlers (business logic)
├── components/            # UI kit, sidebar, top bar, command palette, widgets
└── lib/
    ├── auth.ts            # JWT + bcrypt + getSession()
    ├── rbac.ts            # role predicates + Prisma scoping helpers
    ├── events.ts          # activity-log & notification helpers
    ├── validations.ts     # Zod schemas
    └── db.ts              # Prisma client singleton
prisma/
├── schema.prisma         # data model
└── seed.ts               # demo data
```

---

## Design system

A restrained, "expensive" enterprise aesthetic: warm neutral surfaces (`#F8F7F4`), emerald
as the single brand accent (no dominant blue), 16–24px radii, soft shadows, and generous
whitespace. Motion is subtle (150–250ms) and fully respects `prefers-reduced-motion`.
Highlights include a `⌘/Ctrl-K` command palette, animated KPI counters, skeleton loaders,
a timeline activity feed, and accessible focus states throughout.
