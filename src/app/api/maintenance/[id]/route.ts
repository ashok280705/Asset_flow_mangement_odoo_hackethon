import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isManager } from '@/lib/rbac'
import { logActivity, notify } from '@/lib/events'

const VALID = ['APPROVED', 'REJECTED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS', 'RESOLVED']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || !isManager(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status, notes, technicianId } = await req.json()
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const mr = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { asset: { select: { id: true, name: true, assetTag: true } } },
  })
  if (!mr) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data: Record<string, unknown> = { status }
  if (notes) data.notes = notes
  if (technicianId) data.technicianId = technicianId
  if (status === 'RESOLVED') data.resolvedAt = new Date()

  // Keep the asset lifecycle in sync with the maintenance workflow:
  //  approval/in-progress → UNDER_MAINTENANCE, resolution/rejection → AVAILABLE.
  if (status === 'APPROVED' || status === 'IN_PROGRESS' || status === 'TECHNICIAN_ASSIGNED') {
    await prisma.asset.update({ where: { id: mr.assetId }, data: { status: 'UNDER_MAINTENANCE' } })
  }
  if (status === 'RESOLVED' || status === 'REJECTED') {
    await prisma.asset.update({ where: { id: mr.assetId }, data: { status: 'AVAILABLE' } })
  }

  const updated = await prisma.maintenanceRequest.update({ where: { id }, data })

  await logActivity(user.id, `MAINTENANCE_${status}`, 'Asset', mr.assetId, `${mr.asset.assetTag} — ${status.replace(/_/g, ' ').toLowerCase()}`)

  // Notify the person who raised it at each meaningful transition.
  const messages: Record<string, string> = {
    APPROVED: `Your maintenance request for ${mr.asset.name} (${mr.asset.assetTag}) was approved.`,
    REJECTED: `Your maintenance request for ${mr.asset.name} (${mr.asset.assetTag}) was rejected.`,
    TECHNICIAN_ASSIGNED: `A technician was assigned to ${mr.asset.name} (${mr.asset.assetTag}).`,
    IN_PROGRESS: `Repair work started on ${mr.asset.name} (${mr.asset.assetTag}).`,
    RESOLVED: `${mr.asset.name} (${mr.asset.assetTag}) is repaired and back in service.`,
  }
  if (messages[status]) {
    await notify(mr.raisedById, `Maintenance ${status.replace(/_/g, ' ').toLowerCase()}`, messages[status], 'MAINTENANCE')
  }

  return NextResponse.json({ request: updated })
}
