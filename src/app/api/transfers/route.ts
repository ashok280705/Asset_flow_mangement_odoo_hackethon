import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { transferScope } from '@/lib/rbac'
import { logActivity, notifyRoles } from '@/lib/events'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assetId, reason } = await req.json()
  if (!assetId) return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })

  const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { name: true, assetTag: true } })
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  // Guard against duplicate open requests from the same person for the same asset.
  const existing = await prisma.transferRequest.findFirst({
    where: { assetId, requesterId: user.id, status: 'PENDING' },
  })
  if (existing) {
    return NextResponse.json({ error: 'You already have a pending request for this asset' }, { status: 409 })
  }

  const transfer = await prisma.transferRequest.create({
    data: { assetId, requesterId: user.id, reason },
  })

  await logActivity(user.id, 'REQUESTED_TRANSFER', 'Asset', assetId, `Transfer requested for ${asset.assetTag}`)
  await notifyRoles(
    ['ASSET_MANAGER', 'ADMIN', 'DEPARTMENT_HEAD'],
    'Transfer requested',
    `${user.name} requested a transfer of ${asset.name} (${asset.assetTag}).`,
    'TRANSFER'
  )

  return NextResponse.json({ transfer }, { status: 201 })
}

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const transfers = await prisma.transferRequest.findMany({
    where: transferScope(user),
    include: {
      asset: { select: { name: true, assetTag: true } },
      requester: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json({ transfers })
}
