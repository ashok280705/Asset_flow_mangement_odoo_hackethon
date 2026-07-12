import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { assetSchema } from '@/lib/validations'
import { generateAssetTag } from '@/lib/utils'
import { assetScope } from '@/lib/rbac'
import { logActivity } from '@/lib/events'
import type { Prisma } from '@prisma/client'

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

  // Role scope first (employee → own; dept head → their dept; managers → all),
  // then layer the requested filters on top with AND so a filter can never
  // widen what the user is allowed to see.
  const filters: Prisma.AssetWhereInput[] = [assetScope(user)]
  if (search) {
    filters.push({
      OR: [
        { name: { contains: search } },
        { assetTag: { contains: search } },
        { serialNumber: { contains: search } },
      ],
    })
  }
  if (status) filters.push({ status: status as Prisma.AssetWhereInput['status'] })
  if (categoryId) filters.push({ categoryId })
  if (departmentId) filters.push({ departmentId })
  const where: Prisma.AssetWhereInput = { AND: filters }

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
      photoUrl: parsed.data.photoUrl || null,
    }
  })

  await logActivity(user.id, 'CREATED', 'Asset', asset.id, `Asset ${assetTag} registered`)

  return NextResponse.json({ asset }, { status: 201 })
}
