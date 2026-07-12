import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const categories = await prisma.assetCategory.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json({ categories })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !['ADMIN', 'ASSET_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, description, warrantyPeriod } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const category = await prisma.assetCategory.create({
    data: { name, description, warrantyPeriod: warrantyPeriod ? Number(warrantyPeriod) : null }
  })
  return NextResponse.json({ category }, { status: 201 })
}
