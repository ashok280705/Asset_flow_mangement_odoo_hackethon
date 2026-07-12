import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { assetScope } from '@/lib/rbac'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const asset = await prisma.asset.findFirst({
    where: { AND: [{ id }, assetScope(user)] },
    include: {
      category: true,
      department: true,
      allocations: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { allocatedAt: 'desc' }
      },
      maintenanceRequests: {
        include: { raisedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      },
      bookings: {
        include: { user: { select: { name: true } } },
        orderBy: { startTime: 'desc' }
      },
    }
  })
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  return NextResponse.json({ asset })
}
