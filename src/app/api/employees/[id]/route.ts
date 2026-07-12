import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isAdmin } from '@/lib/rbac'
import { logActivity } from '@/lib/events'

/** Admin edits an employee's status (activate/deactivate) and department.
 *  Role changes go through /api/employees/[id]/role. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { status, departmentId } = await req.json()

  const data: Record<string, unknown> = {}
  if (status !== undefined) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = status
  }
  if (departmentId !== undefined) data.departmentId = departmentId || null

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, status: true, departmentId: true },
  })
  await logActivity(user.id, 'UPDATED', 'Employee', id, `${updated.name} updated`)
  return NextResponse.json({ user: updated })
}
