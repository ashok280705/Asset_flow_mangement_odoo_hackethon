import { prisma } from './db'
import type { Role } from './rbac'

/**
 * Side-effect helpers for the audit trail and the notification centre.
 * Every mutating flow calls these so the "who did what, when" log and the
 * per-user notifications stay in sync — matching the problem statement's
 * Activity Logs & Notifications requirements.
 *
 * These NEVER throw: a logging/notification failure must not roll back or
 * break the primary business operation.
 */

export async function logActivity(
  userId: string,
  action: string,
  entity: string,
  entityId?: string | null,
  details?: string | null
) {
  try {
    await prisma.activityLog.create({
      data: { userId, action, entity, entityId: entityId ?? null, details: details ?? null },
    })
  } catch (e) {
    console.error('logActivity failed:', e)
  }
}

export async function notify(
  userId: string,
  title: string,
  message: string,
  type: string
) {
  try {
    await prisma.notification.create({ data: { userId, title, message, type } })
  } catch (e) {
    console.error('notify failed:', e)
  }
}

/** Notify every active user holding one of the given roles (e.g. approvers). */
export async function notifyRoles(
  roles: Role[],
  title: string,
  message: string,
  type: string
) {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: roles }, status: 'ACTIVE' },
      select: { id: true },
    })
    if (users.length === 0) return
    await prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, title, message, type })),
    })
  } catch (e) {
    console.error('notifyRoles failed:', e)
  }
}
