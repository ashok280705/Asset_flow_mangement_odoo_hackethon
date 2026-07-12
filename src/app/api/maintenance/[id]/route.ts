import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || !['ADMIN', 'ASSET_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status, notes, technicianId } = await req.json()

  const data: Record<string, unknown> = { status, updatedAt: new Date() }
  if (notes) data.notes = notes
  if (technicianId) data.technicianId = technicianId
  if (status === 'RESOLVED') data.resolvedAt = new Date()

  if (status === 'APPROVED' || status === 'IN_PROGRESS') {
    await prisma.asset.update({
      where: { id: (await prisma.maintenanceRequest.findUnique({ where: { id } }))!.assetId },
      data: { status: 'UNDER_MAINTENANCE' }
    })
  }
  if (status === 'RESOLVED' || status === 'REJECTED') {
    const mr = await prisma.maintenanceRequest.findUnique({ where: { id } })
    if (mr) {
      await prisma.asset.update({ where: { id: mr.assetId }, data: { status: 'AVAILABLE' } })
    }
  }

  const updated = await prisma.maintenanceRequest.update({ where: { id }, data })
  return NextResponse.json({ request: updated })
}
