import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { bookingSchema } from '@/lib/validations'
import { bookingScope } from '@/lib/rbac'
import { logActivity, notify } from '@/lib/events'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const assetId = searchParams.get('assetId') || ''

  // Scope by role, but always expose an asset's own bookings when a specific
  // resource is requested — the calendar/overlap view needs the full picture.
  const filters: Prisma.BookingWhereInput[] = assetId ? [{ assetId }] : [bookingScope(user)]
  if (status) filters.push({ status: status as Prisma.BookingWhereInput['status'] })

  const bookings = await prisma.booking.findMany({
    where: { AND: filters },
    include: {
      asset: { select: { name: true, assetTag: true } },
      user: { select: { name: true, email: true } }
    },
    orderBy: { startTime: 'asc' }
  })
  return NextResponse.json({ bookings })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = bookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const asset = await prisma.asset.findUnique({ where: { id: parsed.data.assetId } })
  if (!asset || !asset.isBookable) {
    return NextResponse.json({ error: 'Asset is not bookable' }, { status: 400 })
  }

  const start = new Date(parsed.data.startTime)
  const end = new Date(parsed.data.endTime)

  if (end <= start) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
  }

  const overlap = await prisma.booking.findFirst({
    where: {
      assetId: parsed.data.assetId,
      status: { in: ['UPCOMING', 'ONGOING'] },
      OR: [
        { startTime: { lte: end }, endTime: { gte: start } }
      ]
    }
  })

  if (overlap) {
    return NextResponse.json({ error: 'Asset is already booked for this time slot' }, { status: 409 })
  }

  const booking = await prisma.booking.create({
    data: {
      assetId: parsed.data.assetId,
      userId: user.id,
      startTime: start,
      endTime: end,
      purpose: parsed.data.purpose,
    }
  })

  await logActivity(user.id, 'BOOKED', 'Asset', asset.id, `${asset.assetTag} booked`)
  await notify(
    user.id,
    'Booking confirmed',
    `Your booking for ${asset.name} (${asset.assetTag}) is confirmed.`,
    'BOOKING'
  )

  return NextResponse.json({ booking }, { status: 201 })
}
