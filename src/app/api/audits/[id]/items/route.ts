import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isManager } from '@/lib/rbac'
import { logActivity, notifyRoles } from '@/lib/events'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { assetId, result, notes } = await req.json()
  if (!assetId || !['VERIFIED', 'MISSING', 'DAMAGED'].includes(result)) {
    return NextResponse.json({ error: 'Asset and a valid result are required' }, { status: 400 })
  }

  const cycle = await prisma.auditCycle.findUnique({
    where: { id },
    include: { assignments: { select: { auditorId: true } } },
  })
  if (!cycle) return NextResponse.json({ error: 'Audit cycle not found' }, { status: 404 })
  if (cycle.status === 'CLOSED') {
    return NextResponse.json({ error: 'Audit cycle is closed' }, { status: 400 })
  }

  // Only an assigned auditor (or a manager) may record findings.
  const isAssigned = cycle.assignments.some((a) => a.auditorId === user.id)
  if (!isAssigned && !isManager(user)) {
    return NextResponse.json({ error: 'Only assigned auditors can record findings' }, { status: 403 })
  }

  const existing = await prisma.auditItem.findFirst({ where: { auditCycleId: id, assetId } })
  const item = existing
    ? await prisma.auditItem.update({ where: { id: existing.id }, data: { result, notes, auditedAt: new Date() } })
    : await prisma.auditItem.create({ data: { auditCycleId: id, assetId, result, notes, auditedAt: new Date() } })

  await prisma.auditCycle.update({ where: { id }, data: { status: 'IN_PROGRESS' } })

  await logActivity(user.id, `AUDIT_${result}`, 'Asset', assetId, `Audit finding: ${result.toLowerCase()}`)
  if (result === 'MISSING' || result === 'DAMAGED') {
    const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { name: true, assetTag: true } })
    await notifyRoles(
      ['ASSET_MANAGER', 'ADMIN'],
      'Audit discrepancy flagged',
      `${asset?.name ?? 'An asset'} (${asset?.assetTag ?? assetId}) was marked ${result.toLowerCase()} during ${cycle.name}.`,
      'AUDIT'
    )
  }

  return NextResponse.json({ item })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const items = await prisma.auditItem.findMany({
    where: { auditCycleId: id },
    include: { asset: { select: { id: true, name: true, assetTag: true, location: true } } },
    orderBy: { asset: { assetTag: 'asc' } },
  })
  return NextResponse.json({ items })
}
