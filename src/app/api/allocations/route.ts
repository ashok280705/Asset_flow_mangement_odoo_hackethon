import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { allocationSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (user.role === 'EMPLOYEE') where.userId = user.id

  const allocations = await prisma.allocation.findMany({
    where,
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
  if (!user || !['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = allocationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const asset = await prisma.asset.findUnique({ where: { id: parsed.data.assetId } })
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  if (asset.status !== 'AVAILABLE') {
    return NextResponse.json({ error: 'Asset is not available for allocation' }, { status: 409 })
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

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'ALLOCATED',
      entity: 'Asset',
      entityId: parsed.data.assetId,
      details: `Asset allocated`,
    }
  })

  return NextResponse.json({ allocation }, { status: 201 })
}
