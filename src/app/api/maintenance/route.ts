import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { maintenanceSchema } from '@/lib/validations'
import { maintenanceScope } from '@/lib/rbac'
import { logActivity, notifyRoles } from '@/lib/events'
import type { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const priority = searchParams.get('priority') || ''

  const filters: Prisma.MaintenanceRequestWhereInput[] = [maintenanceScope(user)]
  if (status) filters.push({ status: status as Prisma.MaintenanceRequestWhereInput['status'] })
  if (priority) filters.push({ priority: priority as Prisma.MaintenanceRequestWhereInput['priority'] })

  const requests = await prisma.maintenanceRequest.findMany({
    where: { AND: filters },
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

  const asset = await prisma.asset.findUnique({ where: { id: parsed.data.assetId }, select: { name: true, assetTag: true } })
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  const request = await prisma.maintenanceRequest.create({
    data: {
      assetId: parsed.data.assetId,
      raisedById: user.id,
      description: parsed.data.description,
      priority: parsed.data.priority,
    }
  })

  await logActivity(user.id, 'RAISED_MAINTENANCE', 'Asset', parsed.data.assetId, `Maintenance request for ${asset.assetTag}`)
  await notifyRoles(
    ['ASSET_MANAGER', 'ADMIN'],
    'Maintenance request raised',
    `${user.name} raised a ${parsed.data.priority.toLowerCase()}-priority request for ${asset.name} (${asset.assetTag}).`,
    'MAINTENANCE'
  )

  return NextResponse.json({ request }, { status: 201 })
}
