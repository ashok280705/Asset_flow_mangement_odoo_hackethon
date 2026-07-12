import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    assetsByStatus,
    assetsByCategory,
    assetsByDept,
    maintenanceTrend,
    allocationTrend,
  ] = await Promise.all([
    prisma.asset.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.asset.groupBy({ by: ['categoryId'], _count: { _all: true }, _sum: { acquisitionCost: true } }),
    prisma.asset.groupBy({ by: ['departmentId'], _count: { _all: true } }),
    prisma.maintenanceRequest.groupBy({
      by: ['priority'],
      _count: { _all: true }
    }),
    prisma.allocation.groupBy({
      by: ['status'],
      _count: { _all: true }
    }),
  ])

  const categories = await prisma.assetCategory.findMany({ select: { id: true, name: true } })
  const departments = await prisma.department.findMany({ select: { id: true, name: true } })
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))
  const deptMap = Object.fromEntries(departments.map(d => [d.id, d.name]))

  return NextResponse.json({
    assetsByStatus: assetsByStatus.map(a => ({ name: a.status, value: a._count._all })),
    assetsByCategory: assetsByCategory.map(a => ({
      name: catMap[a.categoryId] || 'Unknown',
      count: a._count._all,
      cost: Number(a._sum.acquisitionCost || 0)
    })),
    assetsByDept: assetsByDept
      .filter(a => a.departmentId)
      .map(a => ({
        name: deptMap[a.departmentId!] || 'Unknown',
        value: a._count._all
      })),
    maintenanceTrend: maintenanceTrend.map(m => ({ name: m.priority, value: m._count._all })),
    allocationTrend: allocationTrend.map(a => ({ name: a.status, value: a._count._all })),
  })
}
