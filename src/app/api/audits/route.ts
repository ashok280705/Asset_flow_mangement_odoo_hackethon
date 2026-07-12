import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isManager } from '@/lib/rbac'
import { logActivity, notify } from '@/lib/events'
import type { Prisma } from '@prisma/client'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Managers see every cycle; everyone else sees only cycles they audit.
  const where: Prisma.AuditCycleWhereInput = isManager(user)
    ? {}
    : { assignments: { some: { auditorId: user.id } } }

  const audits = await prisma.auditCycle.findMany({
    where,
    include: {
      department: { select: { name: true } },
      assignments: { include: { auditor: { select: { id: true, name: true } } } },
      _count: { select: { items: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json({ audits })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !isManager(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, scope, departmentId, startDate, endDate, auditorIds } = await req.json()
  if (!name || !scope || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const audit = await prisma.auditCycle.create({
    data: {
      name,
      scope,
      departmentId: departmentId || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      assignments: auditorIds?.length
        ? { create: auditorIds.map((auditorId: string) => ({ auditorId })) }
        : undefined,
    }
  })

  // Seed the checklist: a department cycle audits that department's assets,
  // otherwise the whole active fleet.
  const assets = await prisma.asset.findMany({
    where: departmentId
      ? { departmentId }
      : { status: { notIn: ['RETIRED', 'DISPOSED'] } },
    select: { id: true }
  })
  if (assets.length > 0) {
    await prisma.auditItem.createMany({
      data: assets.map(a => ({ auditCycleId: audit.id, assetId: a.id }))
    })
  }

  await logActivity(user.id, 'CREATED', 'AuditCycle', audit.id, `Audit cycle "${name}" created`)
  if (auditorIds?.length) {
    for (const auditorId of auditorIds as string[]) {
      await notify(auditorId, 'Audit assignment', `You have been assigned to audit cycle "${name}".`, 'AUDIT')
    }
  }

  return NextResponse.json({ audit }, { status: 201 })
}
