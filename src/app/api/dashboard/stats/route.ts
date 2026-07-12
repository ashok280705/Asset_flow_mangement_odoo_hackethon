import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    totalAssets,
    availableAssets,
    allocatedAssets,
    underMaintenance,
    activeAllocations,
    overdueAllocations,
    pendingMaintenance,
    upcomingBookings,
    assetsByCategory,
    assetsByStatus,
    recentActivity,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { status: 'AVAILABLE' } }),
    prisma.asset.count({ where: { status: 'ALLOCATED' } }),
    prisma.asset.count({ where: { status: 'UNDER_MAINTENANCE' } }),
    prisma.allocation.count({ where: { status: 'ACTIVE' } }),
    prisma.allocation.count({
      where: { status: 'ACTIVE', expectedReturn: { lt: new Date() } }
    }),
    prisma.maintenanceRequest.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'UPCOMING' } }),
    prisma.asset.groupBy({
      by: ['categoryId'],
      _count: { _all: true }
    }),
    prisma.asset.groupBy({
      by: ['status'],
      _count: { _all: true }
    }),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } }
    })
  ])

  const categoryDetails = await prisma.assetCategory.findMany({
    where: { id: { in: assetsByCategory.map(a => a.categoryId) } },
    select: { id: true, name: true }
  })

  const categoryMap = Object.fromEntries(categoryDetails.map(c => [c.id, c.name]))
  const categoryChartData = assetsByCategory.map(a => ({
    name: categoryMap[a.categoryId] || 'Unknown',
    value: a._count._all
  }))

  const statusChartData = assetsByStatus.map(a => ({
    name: a.status.replace(/_/g, ' '),
    value: a._count._all
  }))

  return NextResponse.json({
    stats: {
      totalAssets,
      availableAssets,
      allocatedAssets,
      underMaintenance,
      activeAllocations,
      overdueAllocations,
      pendingMaintenance,
      upcomingBookings,
    },
    charts: {
      byCategory: categoryChartData,
      byStatus: statusChartData,
    },
    recentActivity
  })
}
