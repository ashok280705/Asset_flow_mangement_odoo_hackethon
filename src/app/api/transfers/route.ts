import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { assetId, reason } = await req.json()
  if (!assetId) return NextResponse.json({ error: 'Asset ID required' }, { status: 400 })

  const transfer = await prisma.transferRequest.create({
    data: { assetId, requesterId: user.id, reason }
  })
  return NextResponse.json({ transfer }, { status: 201 })
}

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const where = user.role === 'EMPLOYEE' ? { requesterId: user.id } : {}
  const transfers = await prisma.transferRequest.findMany({
    where,
    include: {
      asset: { select: { name: true, assetTag: true } },
      requester: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json({ transfers })
}
