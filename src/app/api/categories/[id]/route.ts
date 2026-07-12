import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isManager } from '@/lib/rbac'
import { logActivity } from '@/lib/events'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user || !isManager(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { name, description, warrantyPeriod } = await req.json()

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (description !== undefined) data.description = description || null
  if (warrantyPeriod !== undefined) data.warrantyPeriod = warrantyPeriod ? Number(warrantyPeriod) : null

  const category = await prisma.assetCategory.update({ where: { id }, data })
  await logActivity(user.id, 'UPDATED', 'AssetCategory', id, `${category.name} updated`)
  return NextResponse.json({ category })
}
