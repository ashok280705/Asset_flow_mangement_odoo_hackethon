import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isApprover } from '@/lib/rbac'
import { logActivity, notify } from '@/lib/events'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || !isApprover(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json()
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const transfer = await prisma.transferRequest.findUnique({
    where: { id },
    include: { asset: { select: { id: true, name: true, assetTag: true } } },
  })
  if (!transfer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (transfer.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request already resolved' }, { status: 400 })
  }

  if (status === 'REJECTED') {
    await prisma.transferRequest.update({ where: { id }, data: { status: 'REJECTED' } })
    await logActivity(user.id, 'REJECTED_TRANSFER', 'Asset', transfer.assetId, `Transfer of ${transfer.asset.assetTag} rejected`)
    await notify(
      transfer.requesterId,
      'Transfer rejected',
      `Your transfer request for ${transfer.asset.name} (${transfer.asset.assetTag}) was rejected.`,
      'TRANSFER'
    )
    return NextResponse.json({ transfer: { ...transfer, status: 'REJECTED' } })
  }

  // APPROVED → re-allocate: close the current holder's allocation, hand the
  // asset to the requester, and keep the asset lifecycle status in sync.
  // The whole re-allocation is atomic so history can never end up half-written.
  const ops = []
  const currentActive = await prisma.allocation.findFirst({
    where: { assetId: transfer.assetId, status: 'ACTIVE' },
  })
  if (currentActive) {
    ops.push(
      prisma.allocation.update({
        where: { id: currentActive.id },
        data: { status: 'RETURNED', returnedAt: new Date(), returnNotes: 'Transferred via approved request' },
      })
    )
  }
  ops.push(
    prisma.allocation.create({
      data: { assetId: transfer.assetId, userId: transfer.requesterId, status: 'ACTIVE', conditionOut: 'GOOD' },
    })
  )
  ops.push(prisma.asset.update({ where: { id: transfer.assetId }, data: { status: 'ALLOCATED' } }))
  ops.push(prisma.transferRequest.update({ where: { id }, data: { status: 'APPROVED' } }))

  await prisma.$transaction(ops)

  await logActivity(user.id, 'APPROVED_TRANSFER', 'Asset', transfer.assetId, `${transfer.asset.assetTag} re-allocated via transfer`)
  await notify(
    transfer.requesterId,
    'Transfer approved',
    `Your transfer request for ${transfer.asset.name} (${transfer.asset.assetTag}) was approved. The asset is now allocated to you.`,
    'TRANSFER'
  )

  return NextResponse.json({ transfer: { ...transfer, status: 'APPROVED' } })
}
