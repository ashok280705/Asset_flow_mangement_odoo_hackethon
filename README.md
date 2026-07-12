<div align="center">

# AssetFlow

### Enterprise Asset & Resource Management System

A centralized ERP platform to **track, allocate, and maintain** an organization's physical
assets and shared resources — replacing spreadsheets and paper logs with structured asset
lifecycles, conflict-free booking, approval-driven maintenance, and scheduled audits.

**[▶ Live Demo →](https://asset-flow-mangement-odoo-hackethon-1.onrender.com)**

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-149eca)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Prisma](https://img.shields.io/badge/Prisma-MySQL-2d3748)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)

</div>

---

> **Live app:** https://asset-flow-mangement-odoo-hackethon-1.onrender.com
> Sign in with any demo account from the [Demo accounts](#demo-accounts) section to explore each role.

AssetFlow is industry-agnostic: any organization with equipment, furniture, vehicles, or
shared spaces (offices, schools, hospitals, factories, agencies) can use it. It delivers
core ERP functionality with clean architecture and secure role-based workflows, and
deliberately stays out of purchasing, invoicing, and accounting.

## Table of contents

- [Highlights](#highlights)
- [User roles](#user-roles)
- [Roles & permissions matrix](#roles--permissions-matrix)
- [Features](#features)
- [Core workflows](#core-workflows)
- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [API surface](#api-surface)
- [Project structure](#project-structure)
- [Deployment](#deployment)

---

## Highlights

- **Secure, non-self-elevating accounts** — public signup creates an *Employee* only; roles
  are assigned exclusively by an Admin in Organization Setup.
- **Strict role-based data scoping** — every list and metric is filtered server-side by role:
  employees see only assets allocated to them, department heads see only their department,
  managers/admins see the whole organization. Scoping cannot be bypassed from the client.
- **Conflict-safe operations** — an asset can never be double-allocated, and shared resources
  can never be double-booked (time-slot overlap validation).
- **Approval-driven workflows** — maintenance requests and asset transfers move through
  explicit approval states before anything changes; transfers atomically re-allocate the
  asset and update history.
- **Full audit trail & notifications** — every meaningful action writes an activity log and
  notifies the relevant users.
- **Premium, responsive UI** — bento KPI dashboard, command palette (`⌘/Ctrl-K`), calendar
  booking view, skeleton loaders, and accessible, keyboard-navigable components.

---

## User roles

Roles are assigned only by an Admin, in **Organization Setup → Employee Directory** — the
single source of truth for who can do what. Every screen and API adapts to the signed-in
role.

### 👑 Admin
The organization owner. Manages all master data and has full visibility.
- Creates, edits, and deactivates **departments** (with hierarchy, department head & status)
- Creates and edits **asset categories** (with warranty periods)
- Manages the **employee directory** — adds people, assigns **roles**, departments & status
- Runs and closes **audit cycles**
- Views **organization-wide analytics** and every record

### 🔧 Asset Manager
The operational owner of the asset lifecycle.
- **Registers** assets and **allocates** them to employees/departments
- **Approves** transfer requests, maintenance requests, and audit discrepancy resolutions
- **Approves asset returns** and records condition check-in notes
- Organization-wide asset visibility and reports

### 🏢 Department Head
Oversees their own department.
- Views assets **allocated to their department**
- **Approves allocation/transfer requests** within their department
- **Books shared resources** on behalf of the department
- Department-scoped reports

### 👤 Employee
The everyday end user.
- Views assets **allocated to them** only
- **Books shared resources** (rooms, vehicles, equipment)
- **Raises maintenance requests** for assets they hold
- **Initiates return / transfer requests**

---

## Roles & permissions matrix

Enforced server-side in [`src/lib/rbac.ts`](src/lib/rbac.ts) and mirrored in the UI, so users
never see actions they cannot perform.

| Capability | Admin | Asset Manager | Department Head | Employee |
| --- | :---: | :---: | :---: | :---: |
| View all assets | Yes | Yes | Dept only | Own only |
| Register assets | Yes | Yes | — | — |
| Allocate assets | Yes | Yes | Dept | — |
| Approve transfers | Yes | Yes | Dept | — |
| Approve maintenance | Yes | Yes | — | — |
| Raise maintenance / book resources | Yes | Yes | Yes | Yes |
| Return / request transfer | Yes | Yes | Yes | Own |
| Run & close audit cycles | Yes | Yes | — | — |
| Record audit findings | Yes | Yes | — | If assigned |
| Organization Setup (departments, categories, roles) | Yes | — | — | — |
| Reports & analytics | Yes | Yes | Yes | — |

**How scoping works:** each read endpoint composes a Prisma `where` from `rbac.ts`
(`assetScope`, `allocationScope`, `maintenanceScope`, …) *before* applying any user filter,
using `AND` so a query parameter can never widen a user's visibility. Dashboard KPIs are
scoped the same way, so every role gets an accurate snapshot of *their* world.

---

## Features

1. **Authentication** — email/password login (JWT httpOnly cookie, bcrypt), session
   validation, employee-only signup.
2. **Dashboard** — KPI cards (Available, Allocated, Maintenance Today, Active Bookings,
   Pending Transfers, Upcoming Returns), utilization & fleet-health rings, status/category
   distribution, activity timeline, "needs attention" panel, role-aware quick actions.
3. **Organization Setup (Admin)** — Departments (hierarchy, head, status), Asset Categories
   (warranty period), Employee Directory (add employees, assign roles/departments/status).
4. **Asset Registration & Directory** — auto asset tags (`AF-0001`), serial, acquisition
   date/cost, condition, location, photo, bookable flag; search & filters (status, category,
   department); per-asset allocation & maintenance history.
5. **Allocation & Transfer** — allocate with expected return date; conflict rule surfaces the
   current holder + a **Request Transfer** action; transfer workflow (Requested → Approved →
   Re-allocated) updates history atomically; returns capture condition check-in notes.
6. **Resource Booking** — **calendar view**, time-slot overlap validation, statuses
   (Upcoming/Ongoing/Completed/Cancelled), reschedule, and reminders for imminent bookings.
7. **Maintenance** — raise → Approved/Rejected → Technician Assigned → In Progress → Resolved;
   asset status auto-syncs; per-asset history retained.
8. **Audit Cycles** — create a cycle (scope + date range), assign auditors, record
   Verified/Missing/Damaged, auto-generate a discrepancy report, close (locks + reconciles
   asset state).
9. **Reports & Analytics** — status/category/department distributions, most-used vs idle
   assets, maintenance frequency, warranty & retirement alerts, resource booking heatmap,
   and CSV export.
10. **Activity Logs & Notifications** — per-user notifications for every event plus a full
    "who did what, when" audit log.

---

## Core workflows

**Allocation conflict → transfer.** Allocating an already-held asset returns `409` with the
holder's name; the UI offers *Request Transfer instead*, which files a `TransferRequest`. On
approval the asset is atomically returned from the current holder, re-allocated to the
requester, and the requester is notified.

**Maintenance approval.** Anyone can raise a request; only managers advance it. Approval moves
the asset to `UNDER_MAINTENANCE`; resolution/rejection returns it to `AVAILABLE`.

**Booking overlap.** A `9:30–10:30` request against an existing `9:00–10:00` slot is rejected;
`10:00–11:00` is accepted because it starts exactly when the previous one ends.

**Audit close.** Closing a cycle locks it and reconciles reality in one transaction
(confirmed-missing → `LOST`, damaged → condition `DAMAGED`) and produces a discrepancy report.

---

## Tech stack

- **Framework:** Next.js (App Router) + React 19, TypeScript
- **Styling:** Tailwind CSS v4 (custom warm-neutral + emerald design system)
- **Database:** MySQL via Prisma ORM
- **Auth:** JWT (httpOnly cookie) + bcrypt
- **Validation:** Zod · **Charts/Icons:** Recharts · Lucide
- **Hosting:** Render

---

## Data model

Prisma schema: [`prisma/schema.prisma`](prisma/schema.prisma).

```
User ── Department (many users; optional department head + parent hierarchy)
Asset ── AssetCategory, Department
Allocation      Asset ↔ User   (ACTIVE / RETURNED / OVERDUE, condition in/out, expected return)
TransferRequest Asset ↔ User   (PENDING / APPROVED / REJECTED)
Booking         Asset ↔ User   (UPCOMING / ONGOING / COMPLETED / CANCELLED, time slot)
MaintenanceRequest Asset ↔ User (PENDING → … → RESOLVED, priority, technician)
AuditCycle ── AuditAssignment (auditors) ── AuditItem (VERIFIED / MISSING / DAMAGED)
Notification, ActivityLog  (per-user feeds + org-wide audit trail)
```

Asset lifecycle: `AVAILABLE · ALLOCATED · RESERVED · UNDER_MAINTENANCE · LOST · RETIRED ·
DISPOSED`. Integrity is enforced with foreign keys, unique constraints (`User.email`,
`Department.name`/`code`, `AssetCategory.name`, `Asset.assetTag`) and enums for every
lifecycle state.

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
Create a `.env` in the project root:
```env
DATABASE_URL="mysql://user:password@localhost:3306/assetflow"
JWT_SECRET="a-long-random-secret"
NEXTAUTH_SECRET="another-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Set up the database
```bash
npx prisma generate      # generate the Prisma client
npx prisma db push       # create the schema
npx prisma db seed       # load demo departments, categories, users & assets
```

### 4. Run
```bash
npm run dev              # http://localhost:3000
```
Production build: `npm run build && npm run start`.

---

## Demo accounts

Try the [live app](https://asset-flow-mangement-odoo-hackethon-1.onrender.com) with any of these
(seeded by `prisma/seed.ts`):

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@assetflow.com` | `Admin@123` |
| Asset Manager | `manager@assetflow.com` | `Manager@123` |
| Department Head | `head@assetflow.com` | `Head@123` |
| Employee | `emp1@assetflow.com` | `Employee@123` |
| Employee | `emp2@assetflow.com` | `Employee@123` |

Sign in as different roles to see the access model in action — `emp1` sees only their
allocated asset, while `admin` sees the whole fleet.

---

## API surface

All routes live under `src/app/api` and require a valid session; mutating routes enforce role
checks.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/{signup,login,logout}` · `GET /api/auth/me` |
| Assets | `GET/POST /api/assets` · `GET /api/assets/:id` |
| Allocations | `GET/POST /api/allocations` · `PATCH /api/allocations/:id/return` |
| Transfers | `GET/POST /api/transfers` · `PATCH /api/transfers/:id` |
| Bookings | `GET/POST /api/bookings` · `PATCH /api/bookings/:id` · `POST /api/bookings/reminders` |
| Maintenance | `GET/POST /api/maintenance` · `PATCH /api/maintenance/:id` |
| Audits | `GET/POST /api/audits` · `GET/POST /api/audits/:id/items` · `PATCH /api/audits/:id/close` |
| Setup | `GET/POST /api/departments` · `PATCH /api/departments/:id` · `GET/POST /api/categories` · `PATCH /api/categories/:id` · `GET/POST /api/employees` · `PATCH /api/employees/:id` · `PATCH /api/employees/:id/role` |
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

## Deployment

Deployed on **Render**: **https://asset-flow-mangement-odoo-hackethon-1.onrender.com**

The app is a standard Next.js server build (`npm run build` → `npm run start`) backed by a
managed MySQL database. Set `DATABASE_URL`, `JWT_SECRET`, `NEXTAUTH_SECRET`, and
`NEXT_PUBLIC_APP_URL` as environment variables in the hosting dashboard, then run
`prisma db push` and `prisma db seed` once against the production database.

---

<div align="center">
Built for the Odoo Hackathon · © AssetFlow
</div>
