import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const REMINDER_TITLE = 'Booking reminder'
const WINDOW_MINUTES = 60

/**
 * Poll-based booking reminders. Called when the app loads; generates a one-off
 * notification for each of the caller's upcoming bookings that start within the
 * next hour. Deduped against already-sent reminders (matched by message) so a
 * booking is never reminded twice — no scheduler required.
 */
export async function POST() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const soon = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000)

  const upcoming = await prisma.booking.findMany({
    where: { userId: user.id, status: 'UPCOMING', startTime: { gte: now, lte: soon } },
    include: { asset: { select: { name: true, assetTag: true } } },
  })
  if (upcoming.length === 0) return NextResponse.json({ created: 0 })

  const existing = await prisma.notification.findMany({
    where: { userId: user.id, title: REMINDER_TITLE },
    select: { message: true },
  })
  const seen = new Set(existing.map((n) => n.message))

  const toCreate = upcoming
    .map((b) => ({
      booking: b,
      message: `${b.asset.name} (${b.asset.assetTag}) starts at ${b.startTime.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}.`,
    }))
    .filter((x) => !seen.has(x.message))

  if (toCreate.length > 0) {
    await prisma.notification.createMany({
      data: toCreate.map((x) => ({ userId: user.id, title: REMINDER_TITLE, message: x.message, type: 'BOOKING' })),
    })
  }

  return NextResponse.json({ created: toCreate.length })
}
