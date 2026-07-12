import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isApprover } from '@/lib/rbac'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // The employee directory backs manager workflows (allocation targets,
  // auditor selection, role management) — not an employee-facing screen.
  if (!isApprover(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const employees = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      departmentId: true,
      department: { select: { name: true } },
      createdAt: true,
      _count: { select: { allocations: true } }
    },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json({ employees })
}
