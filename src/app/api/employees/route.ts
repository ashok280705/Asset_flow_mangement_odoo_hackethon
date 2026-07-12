import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, hashPassword } from '@/lib/auth'
import { isApprover, isAdmin } from '@/lib/rbac'
import { logActivity } from '@/lib/events'

const ROLES = ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE']

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

// Admin adds a person directly to the Employee Directory. This is the same
// "directory-owned" account model as signup — the only place roles/departments
// are assigned — just initiated by an admin instead of self-signup.
export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, password, departmentId, role } = await req.json()
  if (!name || name.length < 2) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
  if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  const finalRole = ROLES.includes(role) ? role : 'EMPLOYEE'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const created = await prisma.user.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      role: finalRole,
      departmentId: departmentId || null,
    },
    select: { id: true, name: true, email: true, role: true, status: true, departmentId: true },
  })

  await logActivity(user.id, 'CREATED', 'Employee', created.id, `${name} added to the directory`)
  return NextResponse.json({ user: created }, { status: 201 })
}
