import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isApprover } from '@/lib/rbac'
import { logActivity, notifyRoles } from '@/lib/events'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { conditionIn, returnNotes } = await req.json()

  const allocation = await prisma.allocation.findUnique({
    where: { id },
    include: { asset: { select: { name: true, assetTag: true } } },
  })
  if (!allocation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (allocation.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Allocation already closed' }, { status: 400 })
  }

  // The holder can return their own asset; approvers can return on anyone's behalf.
  const isHolder = allocation.userId === user.id
  if (!isHolder && !isApprover(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [updated] = await prisma.$transaction([
    prisma.allocation.update({
      where: { id },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        conditionIn: conditionIn || allocation.conditionOut,
        returnNotes
      }
    }),
    prisma.asset.update({
      where: { id: allocation.assetId },
      data: { status: 'AVAILABLE' }
    })
  ])

  await logActivity(
    user.id,
    'RETURNED',
    'Asset',
    allocation.assetId,
    `${allocation.asset.assetTag} returned${conditionIn ? ` in ${conditionIn} condition` : ''}`
  )
  // Keep asset managers in the loop for the return / condition check-in review.
  await notifyRoles(
    ['ASSET_MANAGER', 'ADMIN'],
    'Asset returned',
    `${allocation.asset.name} (${allocation.asset.assetTag}) was returned and is now available.`,
    'RETURN'
  )

  return NextResponse.json({ allocation: updated })
}
