import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { maintenanceSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const priority = searchParams.get('priority') || ''

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (priority) where.priority = priority
  if (user.role === 'EMPLOYEE') where.raisedById = user.id

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    include: {
      asset: { select: { name: true, assetTag: true } },
      raisedBy: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json({ requests })
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = maintenanceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const request = await prisma.maintenanceRequest.create({
    data: {
      assetId: parsed.data.assetId,
      raisedById: user.id,
      description: parsed.data.description,
      priority: parsed.data.priority,
    }
  })

  return NextResponse.json({ request }, { status: 201 })
}
