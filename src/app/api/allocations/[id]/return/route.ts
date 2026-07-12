import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || !['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { conditionIn, returnNotes } = await req.json()

  const allocation = await prisma.allocation.findUnique({ where: { id } })
  if (!allocation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (allocation.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Allocation already closed' }, { status: 400 })
  }

  const [updated] = await prisma.$transaction([
    prisma.allocation.update({
      where: { id },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        conditionIn: conditionIn || allocation.conditionOut,
        returnNotes
      }
    }),
    prisma.asset.update({
      where: { id: allocation.assetId },
      data: { status: 'AVAILABLE' }
    })
  ])

  return NextResponse.json({ allocation: updated })
}
