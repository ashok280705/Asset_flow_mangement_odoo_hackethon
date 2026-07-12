import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isAdmin } from '@/lib/rbac'
import { logActivity } from '@/lib/events'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name, code, parentId, headId, status } = await req.json()

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (code !== undefined) data.code = code
  if (parentId !== undefined) data.parentId = parentId || null
  if (headId !== undefined) data.headId = headId || null
  if (status !== undefined) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = status
  }
  // A department can't be its own parent.
  if (data.parentId === id) return NextResponse.json({ error: 'A department cannot be its own parent' }, { status: 400 })

  const dept = await prisma.department.update({ where: { id }, data })
  await logActivity(user.id, 'UPDATED', 'Department', id, `${dept.name} updated`)
  return NextResponse.json({ department: dept })
}
