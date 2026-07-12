import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { assetId, result, notes } = await req.json()

  // Find existing audit item for this asset in this cycle
  const existing = await prisma.auditItem.findFirst({
    where: { auditCycleId: id, assetId }
  })

  const item = existing
    ? await prisma.auditItem.update({
        where: { id: existing.id },
        data: { result, notes, auditedAt: new Date() }
      })
    : await prisma.auditItem.create({
        data: { auditCycleId: id, assetId, result, notes, auditedAt: new Date() }
      })

  await prisma.auditCycle.update({
    where: { id },
    data: { status: 'IN_PROGRESS' }
  })

  return NextResponse.json({ item })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const items = await prisma.auditItem.findMany({
    where: { auditCycleId: id },
    include: { asset: { select: { name: true, assetTag: true, location: true } } }
  })
  return NextResponse.json({ items })
}
