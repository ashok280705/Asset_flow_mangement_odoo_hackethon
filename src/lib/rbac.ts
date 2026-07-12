import type { Prisma } from '@prisma/client'

/**
 * Central role-based access control.
 *
 * Roles (from the problem statement):
 *  - ADMIN          → org-wide visibility; owns Organization Setup.
 *  - ASSET_MANAGER  → registers/allocates assets; approves transfers, maintenance,
 *                     returns and audit resolutions; org-wide asset visibility.
 *  - DEPARTMENT_HEAD→ sees assets allocated to *their department*; approves
 *                     allocation/transfer within their department.
 *  - EMPLOYEE       → sees only assets allocated to *them*; books resources,
 *                     raises maintenance, initiates return/transfer requests.
 */

export type Role = 'ADMIN' | 'ASSET_MANAGER' | 'DEPARTMENT_HEAD' | 'EMPLOYEE'

export interface SessionUser {
  id: string
  role: string
  departmentId: string | null
}

/** A filter that matches no rows — used when a scope has nothing to show. */
const MATCH_NONE = '__no_match__'

export const isAdmin = (u: SessionUser) => u.role === 'ADMIN'
export const isAssetManager = (u: SessionUser) => u.role === 'ASSET_MANAGER'
export const isDeptHead = (u: SessionUser) => u.role === 'DEPARTMENT_HEAD'
export const isEmployee = (u: SessionUser) => u.role === 'EMPLOYEE'

/** ADMIN or ASSET_MANAGER — the operational managers with org-wide reach. */
export const isManager = (u: SessionUser) => u.role === 'ADMIN' || u.role === 'ASSET_MANAGER'

/** Anyone who can approve within a scope (managers + department heads). */
export const isApprover = (u: SessionUser) => isManager(u) || isDeptHead(u)

export const has = (u: SessionUser, ...roles: Role[]) => roles.includes(u.role as Role)

/**
 * Prisma `where` scoping an asset query to what a user is allowed to see.
 *  - managers  → everything
 *  - dept head → assets tagged to their department
 *  - employee  → assets currently allocated to them
 */
export function assetScope(u: SessionUser): Prisma.AssetWhereInput {
  if (isManager(u)) return {}
  if (isDeptHead(u)) return { departmentId: u.departmentId ?? MATCH_NONE }
  return { allocations: { some: { userId: u.id, status: 'ACTIVE' } } }
}

/** Scope an allocation query. Dept heads see allocations held by their department's people. */
export function allocationScope(u: SessionUser): Prisma.AllocationWhereInput {
  if (isManager(u)) return {}
  if (isDeptHead(u)) return { user: { departmentId: u.departmentId ?? MATCH_NONE } }
  return { userId: u.id }
}

/** Scope a maintenance query. Dept heads see requests raised by their department. */
export function maintenanceScope(u: SessionUser): Prisma.MaintenanceRequestWhereInput {
  if (isManager(u)) return {}
  if (isDeptHead(u)) return { raisedBy: { departmentId: u.departmentId ?? MATCH_NONE } }
  return { raisedById: u.id }
}

/** Scope a booking query. Non-managers see their own bookings. */
export function bookingScope(u: SessionUser): Prisma.BookingWhereInput {
  if (isManager(u)) return {}
  if (isDeptHead(u)) return { OR: [{ userId: u.id }, { user: { departmentId: u.departmentId ?? MATCH_NONE } }] }
  return { userId: u.id }
}

/** Scope a transfer-request query. */
export function transferScope(u: SessionUser): Prisma.TransferRequestWhereInput {
  if (isManager(u)) return {}
  if (isDeptHead(u)) return { OR: [{ requesterId: u.id }, { requester: { departmentId: u.departmentId ?? MATCH_NONE } }] }
  return { requesterId: u.id }
}
