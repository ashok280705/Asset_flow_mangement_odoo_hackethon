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
  const body = await req.json()
  const { status, startTime, endTime } = body

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { asset: { select: { name: true, assetTag: true } } },
  })
  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (booking.userId !== user.id && !isManager(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Reschedule: new time slot, re-validated for overlaps ──────────────
  if (startTime && endTime) {
    if (booking.status !== 'UPCOMING') {
      return NextResponse.json({ error: 'Only upcoming bookings can be rescheduled' }, { status: 400 })
    }
    const start = new Date(startTime)
    const end = new Date(endTime)
    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }
    const overlap = await prisma.booking.findFirst({
      where: {
        id: { not: id },
        assetId: booking.assetId,
        status: { in: ['UPCOMING', 'ONGOING'] },
        startTime: { lte: end },
        endTime: { gte: start },
      },
    })
    if (overlap) {
      return NextResponse.json({ error: 'That time slot overlaps an existing booking' }, { status: 409 })
    }
    const updated = await prisma.booking.update({ where: { id }, data: { startTime: start, endTime: end } })
    await logActivity(user.id, 'RESCHEDULED', 'Asset', booking.assetId, `${booking.asset.assetTag} booking rescheduled`)
    await notify(booking.userId, 'Booking rescheduled', `Your booking for ${booking.asset.name} (${booking.asset.assetTag}) was moved to a new time.`, 'BOOKING')
    return NextResponse.json({ booking: updated })
  }

  // ── Status change (cancel / complete / start) ─────────────────────────
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const updated = await prisma.booking.update({ where: { id }, data: { status } })
  await logActivity(user.id, `BOOKING_${status}`, 'Asset', booking.assetId, `${booking.asset.assetTag} booking ${status.toLowerCase()}`)
  if (status === 'CANCELLED') {
    await notify(booking.userId, 'Booking cancelled', `Your booking for ${booking.asset.name} (${booking.asset.assetTag}) was cancelled.`, 'BOOKING')
  }
  return NextResponse.json({ booking: updated })
}
