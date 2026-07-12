import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const audits = await prisma.auditCycle.findMany({
    include: {
      department: { select: { name: true } },
      assignments: { include: { auditor: { select: { name: true } } } },
      _count: { select: { items: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json({ audits })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !['ADMIN', 'ASSET_MANAGER'].includes(user.role)) {
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

  if (departmentId) {
    const assets = await prisma.asset.findMany({
      where: { departmentId },
      select: { id: true }
    })
    if (assets.length > 0) {
      await prisma.auditItem.createMany({
        data: assets.map(a => ({ auditCycleId: audit.id, assetId: a.id }))
      })
    }
  }

  return NextResponse.json({ audit }, { status: 201 })
}
