import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { assetSchema } from '@/lib/validations'
import { generateAssetTag } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const departmentId = searchParams.get('departmentId') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { assetTag: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status) where.status = status
  if (categoryId) where.categoryId = categoryId
  if (departmentId) where.departmentId = departmentId

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        category: { select: { name: true } },
        department: { select: { name: true } },
        allocations: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { name: true, email: true } } },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.asset.count({ where })
  ])

  return NextResponse.json({ assets, total, page, limit })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !['ADMIN', 'ASSET_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = assetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const count = await prisma.asset.count()
  const assetTag = generateAssetTag(count + 1)

  const asset = await prisma.asset.create({
    data: {
      ...parsed.data,
      assetTag,
      acquisitionDate: new Date(parsed.data.acquisitionDate),
      acquisitionCost: parsed.data.acquisitionCost ?? null,
      departmentId: parsed.data.departmentId || null,
    }
  })

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'CREATED',
      entity: 'Asset',
      entityId: asset.id,
      details: `Asset ${assetTag} registered`,
    }
  })

  return NextResponse.json({ asset }, { status: 201 })
}
