'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { AssetDetail } from './AssetDetail'
import { usePermissions } from '@/components/SessionProvider'
import { Search, Plus, Filter, Package, PackageOpen } from 'lucide-react'

interface Asset {
  id: string
  assetTag: string
  name: string
  serialNumber?: string
  status: string
  condition: string
  location?: string
  acquisitionDate: string
  acquisitionCost?: number
  category: { name: string }
  department?: { name: string }
  allocations: { user: { name: string } }[]
}

interface Option { id: string; name: string }

export default function AssetsPage() {
  const { isManager } = usePermissions()
  const [assets, setAssets] = useState<Asset[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<Option[]>([])
  const [departments, setDepartments] = useState<Option[]>([])
  const [detailId, setDetailId] = useState<string | null>(null)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (categoryId) params.set('categoryId', categoryId)
    if (departmentId) params.set('departmentId', departmentId)
    const res = await fetch(`/api/assets?${params}`)
    const data = await res.json()
    setAssets(data.assets || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [search, status, categoryId, departmentId, page])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()).catch(() => ({})),
      fetch('/api/departments').then(r => r.json()).catch(() => ({})),
    ]).then(([c, d]) => {
      setCategories(c.categories || [])
      setDepartments(d.departments || [])
    })
  }, [])

  const statuses = ['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED']
  const hasFilters = Boolean(search || status || categoryId || departmentId)

  return (
    <div className="space-y-6 af-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Asset Directory</h1>
          <p className="text-[#8c8a80] text-[14px] mt-1">
            {isManager ? `${total} assets registered` : `${total} asset${total === 1 ? '' : 's'} assigned to you`}
          </p>
        </div>
        {isManager && (
          <Link
            href="/assets/register"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Register Asset
          </Link>
        )}
      </div>

      <div className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c8a80]" />
            <input
              type="text"
              placeholder="Search by name, tag, serial..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0ded7] rounded-xl text-sm text-[#1c1b18] placeholder-[#a8a69b] focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-[#8c8a80] shrink-0" />
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1) }}
              className="bg-white border border-[#e0ded7] rounded-xl text-sm text-[#1c1b18] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select
              value={categoryId}
              onChange={e => { setCategoryId(e.target.value); setPage(1) }}
              className="bg-white border border-[#e0ded7] rounded-xl text-sm text-[#1c1b18] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {isManager && (
              <select
                value={departmentId}
                onChange={e => { setDepartmentId(e.target.value); setPage(1) }}
                className="bg-white border border-[#e0ded7] rounded-xl text-sm text-[#1c1b18] px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl overflow-hidden">
        {loading ? (
          <div>
            <div className="bg-[#faf9f6] border-b border-[#eceae4] px-4 py-3">
              <div className="af-skeleton h-3 w-40" />
            </div>
            <SkeletonRows rows={8} cols={8} />
          </div>
        ) : assets.length === 0 ? (
          <EmptyState
            icon={hasFilters ? Search : PackageOpen}
            title={hasFilters ? 'No matching assets' : isManager ? 'No assets yet' : 'No assets assigned to you'}
            description={
              hasFilters
                ? 'Try adjusting your search or clearing the filters.'
                : isManager
                  ? 'Register your first asset to start tracking allocation, maintenance and audits.'
                  : 'Assets allocated to you will appear here. Raise a request if you need equipment.'
            }
            action={
              hasFilters ? (
                <button
                  onClick={() => { setSearch(''); setStatus(''); setCategoryId(''); setDepartmentId(''); setPage(1) }}
                  className="inline-flex items-center gap-2 bg-white border border-[#e0ded7] hover:border-[#d3d0c8] text-[#1c1b18] font-medium px-4 py-2 rounded-xl text-sm shadow-xs transition-all"
                >
                  Clear filters
                </button>
              ) : isManager ? (
                <Link
                  href="/assets/register"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl text-sm shadow-xs transition-all"
                >
                  <Plus className="h-4 w-4" /> Register Asset
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#faf9f6] border-b border-[#eceae4]">
                  {['Asset Tag', 'Name', 'Category', 'Status', 'Condition', 'Department', 'Assigned To', 'Acquired'].map(h => (
                    <th key={h} className="sticky top-0 bg-[#faf9f6] text-left text-[11px] font-semibold text-[#8c8a80] uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee9]">
                {assets.map(asset => (
                  <tr
                    key={asset.id}
                    onClick={() => setDetailId(asset.id)}
                    className="hover:bg-[#faf9f6] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-emerald-700 text-xs font-semibold">{asset.assetTag}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[#1c1b18] font-medium">{asset.name}</div>
                      {asset.serialNumber && <div className="text-xs text-[#a8a69b]">{asset.serialNumber}</div>}
                    </td>
                    <td className="px-4 py-3 text-[#57564f]">{asset.category?.name}</td>
                    <td className="px-4 py-3"><Badge status={asset.status} /></td>
                    <td className="px-4 py-3"><Badge status={asset.condition} /></td>
                    <td className="px-4 py-3 text-[#57564f]">{asset.department?.name || '—'}</td>
                    <td className="px-4 py-3 text-[#57564f]">
                      {asset.allocations?.[0]?.user?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#8c8a80]">{formatDate(asset.acquisitionDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#eceae4]">
            <span className="text-sm text-[#8c8a80]">Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="px-3 py-1.5 text-xs bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Asset Details" size="xl">
        {detailId && <AssetDetail id={detailId} />}
      </Modal>
    </div>
  )
}
