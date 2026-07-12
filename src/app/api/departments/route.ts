import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { users: true, assets: true } },
      parent: { select: { name: true } }
    },
    orderBy: { name: 'asc' }
  })
  return NextResponse.json({ departments })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || !['ADMIN', 'ASSET_MANAGER'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, code, parentId } = await req.json()
  if (!name || !code) {
    return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
  }

  const existing = await prisma.department.findFirst({
    where: { OR: [{ name }, { code }] }
  })
  if (existing) {
    return NextResponse.json({ error: 'Department name or code already exists' }, { status: 409 })
  }

  const dept = await prisma.department.create({
    data: { name, code, parentId: parentId || null }
  })
  return NextResponse.json({ department: dept }, { status: 201 })
}
