import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isApprover } from '@/lib/rbac'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Reports & analytics are a management surface — not for individual employees.
  if (!isApprover(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [
    assetsByStatus,
    assetsByCategory,
    assetsByDept,
    maintenanceTrend,
    allocationTrend,
    allocByAsset,
    maintByAsset,
    assets,
    bookings,
  ] = await Promise.all([
    prisma.asset.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.asset.groupBy({ by: ['categoryId'], _count: { _all: true }, _sum: { acquisitionCost: true } }),
    prisma.asset.groupBy({ by: ['departmentId'], _count: { _all: true } }),
    prisma.maintenanceRequest.groupBy({ by: ['priority'], _count: { _all: true } }),
    prisma.allocation.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.allocation.groupBy({ by: ['assetId'], _count: { _all: true } }),
    prisma.maintenanceRequest.groupBy({ by: ['assetId'], _count: { _all: true } }),
    prisma.asset.findMany({
      select: {
        id: true, name: true, assetTag: true, status: true, acquisitionDate: true,
        category: { select: { name: true, warrantyPeriod: true } },
      },
    }),
    prisma.booking.findMany({ select: { startTime: true } }),
  ])

  const categories = await prisma.assetCategory.findMany({ select: { id: true, name: true } })
  const departments = await prisma.department.findMany({ select: { id: true, name: true } })
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const deptMap = Object.fromEntries(departments.map(d => [d.id, d.name]))

  const assetById = Object.fromEntries(assets.map(a => [a.id, a]))
  const allocCount = Object.fromEntries(allocByAsset.map(a => [a.assetId, a._count._all]))
  const maintCount = Object.fromEntries(maintByAsset.map(a => [a.assetId, a._count._all]))

  // Most-used assets (by lifetime allocations)
  const mostUsed = allocByAsset
    .map(a => ({ name: assetById[a.assetId]?.name ?? 'Unknown', assetTag: assetById[a.assetId]?.assetTag ?? '', count: a._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Idle assets — available and never allocated
  const idleAssets = assets
    .filter(a => !allocCount[a.id] && a.status === 'AVAILABLE')
    .map(a => ({ name: a.name, assetTag: a.assetTag, category: a.category?.name ?? '—' }))
    .slice(0, 10)

  // Maintenance frequency — top assets
  const maintenanceByAsset = maintByAsset
    .map(a => ({ name: assetById[a.assetId]?.name ?? 'Unknown', count: a._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Maintenance frequency — by category
  const maintCatTotals: Record<string, number> = {}
  for (const m of maintByAsset) {
    const cat = assetById[m.assetId]?.category?.name ?? 'Unknown'
    maintCatTotals[cat] = (maintCatTotals[cat] ?? 0) + m._count._all
  }
  const maintenanceByCategory = Object.entries(maintCatTotals).map(([name, value]) => ({ name, value }))

  // Warranty & retirement — assets whose warranty is expired or expiring soon
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000
  const warrantyAlerts = assets
    .filter(a => a.category?.warrantyPeriod)
    .map(a => {
      const expiry = new Date(a.acquisitionDate)
      expiry.setMonth(expiry.getMonth() + (a.category!.warrantyPeriod as number))
      const daysLeft = Math.round((expiry.getTime() - now) / DAY)
      return {
        name: a.name, assetTag: a.assetTag, warrantyExpiry: expiry.toISOString(), daysLeft,
        status: daysLeft < 0 ? 'EXPIRED' : daysLeft <= 90 ? 'EXPIRING' : 'OK',
      }
    })
    .filter(a => a.status !== 'OK')
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 12)

  // Booking heatmap — weekday (0=Sun) × hour-of-day (0–23)
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  let heatMax = 0
  for (const b of bookings) {
    const d = b.startTime.getDay()
    const h = b.startTime.getHours()
    heatmap[d][h] += 1
    if (heatmap[d][h] > heatMax) heatMax = heatmap[d][h]
  }

  return NextResponse.json({
    assetsByStatus: assetsByStatus.map(a => ({ name: a.status, value: a._count._all })),
    assetsByCategory: assetsByCategory.map(a => ({
      name: catMap[a.categoryId] || 'Unknown',
      count: a._count._all,
      cost: Number(a._sum.acquisitionCost || 0),
    })),
    assetsByDept: assetsByDept
      .filter(a => a.departmentId)
      .map(a => ({ name: deptMap[a.departmentId!] || 'Unknown', value: a._count._all })),
    maintenanceTrend: maintenanceTrend.map(m => ({ name: m.priority, value: m._count._all })),
    allocationTrend: allocationTrend.map(a => ({ name: a.status, value: a._count._all })),
    mostUsed,
    idleAssets,
    maintenanceByAsset,
    maintenanceByCategory,
    warrantyAlerts,
    bookingHeatmap: { matrix: heatmap, max: heatMax },
  })
}
