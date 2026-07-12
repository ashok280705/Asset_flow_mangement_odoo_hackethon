import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const logs = await prisma.activityLog.findMany({
    where: user.role === 'EMPLOYEE' ? { userId: user.id } : {},
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100
  })
  return NextResponse.json({ logs })
}
