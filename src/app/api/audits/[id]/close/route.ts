import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isManager } from '@/lib/rbac'
import { logActivity, notifyRoles } from '@/lib/events'

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || !isManager(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const cycle = await prisma.auditCycle.findUnique({ where: { id } })
  if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (cycle.status === 'CLOSED') {
    return NextResponse.json({ error: 'Audit cycle already closed' }, { status: 400 })
  }

  const items = await prisma.auditItem.findMany({
    where: { auditCycleId: id },
    include: { asset: { select: { id: true, name: true, assetTag: true } } },
  })

  const missing = items.filter((i) => i.result === 'MISSING')
  const damaged = items.filter((i) => i.result === 'DAMAGED')
  const verified = items.filter((i) => i.result === 'VERIFIED')

  // Closing locks the cycle and reconciles reality:
  //  confirmed-missing → LOST,  damaged → condition DAMAGED (flag for repair).
  const ops = [
    prisma.auditCycle.update({ where: { id }, data: { status: 'CLOSED' } }),
    ...missing.map((i) => prisma.asset.update({ where: { id: i.assetId }, data: { status: 'LOST' as const } })),
    ...damaged.map((i) => prisma.asset.update({ where: { id: i.assetId }, data: { condition: 'DAMAGED' as const } })),
  ]
  await prisma.$transaction(ops)

  const discrepancies = [
    ...missing.map((i) => ({ assetTag: i.asset.assetTag, name: i.asset.name, result: 'MISSING' as const, notes: i.notes })),
    ...damaged.map((i) => ({ assetTag: i.asset.assetTag, name: i.asset.name, result: 'DAMAGED' as const, notes: i.notes })),
  ]

  await logActivity(
    user.id,
    'CLOSED_AUDIT',
    'AuditCycle',
    id,
    `${cycle.name} closed — ${verified.length} verified, ${missing.length} missing, ${damaged.length} damaged`
  )
  if (discrepancies.length > 0) {
    await notifyRoles(
      ['ASSET_MANAGER', 'ADMIN'],
      'Audit discrepancies flagged',
      `${cycle.name} closed with ${discrepancies.length} discrepancy(ies): ${missing.length} missing, ${damaged.length} damaged.`,
      'AUDIT'
    )
  }

  return NextResponse.json({
    status: 'CLOSED',
    report: {
      total: items.length,
      verified: verified.length,
      missing: missing.length,
      damaged: damaged.length,
      discrepancies,
    },
  })
}
