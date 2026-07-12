import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { assetScope, allocationScope, maintenanceScope, bookingScope, transferScope, isManager, isDeptHead } from '@/lib/rbac'
import type { Prisma } from '@prisma/client'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Everything below is scoped to what this role is allowed to see:
  // employees get their own snapshot, department heads their department,
  // managers/admin the whole organisation.
  const aScope = assetScope(user)
  const alScope = allocationScope(user)
  const mScope = maintenanceScope(user)
  const bScope = bookingScope(user)
  const tScope = transferScope(user)

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const and = (base: Prisma.AssetWhereInput, extra: Prisma.AssetWhereInput) => ({ AND: [base, extra] })

  const [
    totalAssets,
    availableAssets,
    allocatedAssets,
    underMaintenance,
    activeAllocations,
    overdueAllocations,
    pendingMaintenance,
    upcomingBookings,
    pendingTransfers,
    upcomingReturns,
    assetsByCategory,
    assetsByStatus,
  ] = await Promise.all([
    prisma.asset.count({ where: aScope }),
    prisma.asset.count({ where: and(aScope, { status: 'AVAILABLE' }) }),
    prisma.asset.count({ where: and(aScope, { status: 'ALLOCATED' }) }),
    prisma.asset.count({ where: and(aScope, { status: 'UNDER_MAINTENANCE' }) }),
    prisma.allocation.count({ where: { AND: [alScope, { status: 'ACTIVE' }] } }),
    prisma.allocation.count({ where: { AND: [alScope, { status: 'ACTIVE', expectedReturn: { lt: now } }] } }),
    prisma.maintenanceRequest.count({ where: { AND: [mScope, { status: 'PENDING' }] } }),
    prisma.booking.count({ where: { AND: [bScope, { status: 'UPCOMING' }] } }),
    prisma.transferRequest.count({ where: { AND: [tScope, { status: 'PENDING' }] } }),
    prisma.allocation.count({ where: { AND: [alScope, { status: 'ACTIVE', expectedReturn: { gte: now, lte: in7Days } }] } }),
    prisma.asset.groupBy({ by: ['categoryId'], where: aScope, _count: { _all: true } }),
    prisma.asset.groupBy({ by: ['status'], where: aScope, _count: { _all: true } }),
  ])

  // Recent activity, scoped the same way as the rest of the dashboard.
  const activityWhere: Prisma.ActivityLogWhereInput = isManager(user)
    ? {}
    : isDeptHead(user)
      ? { user: { departmentId: user.departmentId ?? '__no_match__' } }
      : { userId: user.id }
  const recentActivity = await prisma.activityLog.findMany({
    where: activityWhere,
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  })

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
    role: user.role,
    stats: {
      totalAssets,
      availableAssets,
      allocatedAssets,
      underMaintenance,
      activeAllocations,
      overdueAllocations,
      pendingMaintenance,
      upcomingBookings,
      pendingTransfers,
      upcomingReturns,
    },
    charts: {
      byCategory: categoryChartData,
      byStatus: statusChartData,
    },
    recentActivity
  })
}
