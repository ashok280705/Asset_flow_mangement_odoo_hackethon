'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { Search, Plus, Filter, Package } from 'lucide-react'

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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    const res = await fetch(`/api/assets?${params}`)
    const data = await res.json()
    setAssets(data.assets || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [search, status, page])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  const statuses = ['AVAILABLE', 'ALLOCATED', 'RESERVED', 'UNDER_MAINTENANCE', 'LOST', 'RETIRED', 'DISPOSED']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Asset Directory</h1>
          <p className="text-slate-400 mt-1">{total} assets registered</p>
        </div>
        <Link
          href="/assets/register"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          Register Asset
        </Link>
      </div>

      <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, tag, serial..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1) }}
              className="bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-slate-400 animate-pulse">Loading assets...</div>
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Package className="h-12 w-12 text-slate-600" />
            <p className="text-slate-400">No assets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Asset Tag', 'Name', 'Category', 'Status', 'Condition', 'Department', 'Assigned To', 'Acquired'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {assets.map(asset => (
                  <tr key={asset.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-amber-400 text-xs font-semibold">{asset.assetTag}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-100 font-medium">{asset.name}</div>
                      {asset.serialNumber && <div className="text-xs text-slate-500">{asset.serialNumber}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{asset.category?.name}</td>
                    <td className="px-4 py-3"><Badge status={asset.status} /></td>
                    <td className="px-4 py-3"><Badge status={asset.condition} /></td>
                    <td className="px-4 py-3 text-slate-300">{asset.department?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {asset.allocations?.[0]?.user?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(asset.acquisitionDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <span className="text-sm text-slate-400">Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
