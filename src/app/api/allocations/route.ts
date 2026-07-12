import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { allocationSchema } from '@/lib/validations'
import { allocationScope, isApprover } from '@/lib/rbac'
import { logActivity, notify } from '@/lib/events'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''

  const filters: Prisma.AllocationWhereInput[] = [allocationScope(user)]
  if (status) filters.push({ status: status as Prisma.AllocationWhereInput['status'] })

  const allocations = await prisma.allocation.findMany({
    where: { AND: filters },
    include: {
      asset: { include: { category: { select: { name: true } } } },
      user: { select: { name: true, email: true, department: { select: { name: true } } } }
    },
    orderBy: { allocatedAt: 'desc' }
  })
  return NextResponse.json({ allocations })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !isApprover(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = allocationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const asset = await prisma.asset.findUnique({ where: { id: parsed.data.assetId } })
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  // Conflict rule: an asset that's already held can't be double-allocated.
  // Surface *who* holds it so the UI can offer a Transfer Request instead.
  if (asset.status !== 'AVAILABLE') {
    const active = await prisma.allocation.findFirst({
      where: { assetId: asset.id, status: 'ACTIVE' },
      include: { user: { select: { name: true } } },
    })
    const holder = active?.user?.name
    return NextResponse.json(
      {
        error: holder
          ? `Currently held by ${holder}. Request a transfer instead.`
          : `Asset is ${asset.status.replace(/_/g, ' ').toLowerCase()} and cannot be allocated.`,
        conflict: true,
        holder: holder ?? null,
        assetId: asset.id,
      },
      { status: 409 }
    )
  }

  const [allocation] = await prisma.$transaction([
    prisma.allocation.create({
      data: {
        assetId: parsed.data.assetId,
        userId: parsed.data.userId,
        expectedReturn: parsed.data.expectedReturn ? new Date(parsed.data.expectedReturn) : null,
        conditionOut: parsed.data.conditionOut,
        status: 'ACTIVE',
      }
    }),
    prisma.asset.update({
      where: { id: parsed.data.assetId },
      data: { status: 'ALLOCATED' }
    }),
  ])

  await logActivity(user.id, 'ALLOCATED', 'Asset', asset.id, `${asset.assetTag} allocated`)
  await notify(
    parsed.data.userId,
    'Asset assigned',
    `${asset.name} (${asset.assetTag}) has been allocated to you.`,
    'ALLOCATION'
  )

  return NextResponse.json({ allocation }, { status: 201 })
}
