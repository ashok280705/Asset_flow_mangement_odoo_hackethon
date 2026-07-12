import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isManager } from '@/lib/rbac'
import { logActivity, notify } from '@/lib/events'

const VALID = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { asset: { select: { name: true, assetTag: true } } },
  })
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (booking.userId !== user.id && !isManager(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.booking.update({ where: { id }, data: { status } })

  await logActivity(user.id, `BOOKING_${status}`, 'Asset', booking.assetId, `${booking.asset.assetTag} booking ${status.toLowerCase()}`)
  if (status === 'CANCELLED') {
    await notify(
      booking.userId,
      'Booking cancelled',
      `Your booking for ${booking.asset.name} (${booking.asset.assetTag}) was cancelled.`,
      'BOOKING'
    )
  }

  return NextResponse.json({ booking: updated })
}
