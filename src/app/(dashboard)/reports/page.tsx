'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonWidget } from '@/components/ui/Skeleton'
import { usePermissions } from '@/components/SessionProvider'
import { formatDate } from '@/lib/utils'
import { Lock, Download, TrendingUp, Moon, Wrench, ShieldAlert } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#059669', '#0d9488', '#d97706', '#7c6f9f', '#e11d48', '#57564f', '#14b8a6', '#65a30d']

interface ReportData {
  assetsByStatus: { name: string; value: number }[]
  assetsByCategory: { name: string; count: number; cost: number }[]
  assetsByDept: { name: string; value: number }[]
  maintenanceTrend: { name: string; value: number }[]
  allocationTrend: { name: string; value: number }[]
  mostUsed: { name: string; assetTag: string; count: number }[]
  idleAssets: { name: string; assetTag: string; category: string }[]
  maintenanceByAsset: { name: string; count: number }[]
  maintenanceByCategory: { name: string; value: number }[]
  warrantyAlerts: { name: string; assetTag: string; warrantyExpiry: string; daysLeft: number; status: string }[]
  bookingHeatmap: { matrix: number[][]; max: number }
}

export default function ReportsPage() {
  const { isApprover } = usePermissions()
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isApprover) { setLoading(false); return }
    fetch('/api/reports/assets')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [isApprover])

  const tooltipStyle = { backgroundColor: '#ffffff', border: '1px solid #e9e7e1', borderRadius: '12px', color: '#1c1b18', boxShadow: '0 8px 24px rgba(28,27,24,0.10)', fontSize: '12px' }

  function exportCsv() {
    if (!data) return
    const rows: string[] = ['Section,Label,Value']
    const push = (section: string, items: { name: string; value?: number; count?: number; cost?: number }[]) =>
      items.forEach(i => rows.push(`${section},"${i.name}",${i.value ?? i.count ?? 0}${i.cost !== undefined ? `,${i.cost}` : ''}`))
    push('Assets by Status', data.assetsByStatus)
    push('Assets by Category', data.assetsByCategory)
    push('Assets by Department', data.assetsByDept)
    push('Maintenance by Priority', data.maintenanceTrend)
    push('Allocation Status', data.allocationTrend)
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assetflow-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isApprover) {
    return (
      <div className="af-fade-in">
        <div className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl">
          <EmptyState
            icon={Lock}
            title="Manager access required"
            description="Analytics and reports are available to asset managers, department heads and administrators."
          />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-8 af-fade-in">
        <div className="space-y-2">
          <div className="af-skeleton h-7 w-56" />
          <div className="af-skeleton h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonWidget key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 af-fade-in">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Analytics &amp; Reports</h1>
          <p className="text-[#8c8a80] text-[14px] mt-1">Comprehensive asset management insights</p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 h-9 px-3.5 bg-white border border-[#e6e4dd] rounded-xl text-[13px] font-medium text-[#57564f] shadow-xs hover:border-[#d3d0c8] hover:text-[#1c1b18] transition-all"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Asset Distribution by Status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data?.assetsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {data?.assetsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Assets by Department">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.assetsByDept} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" />
              <XAxis dataKey="name" tick={{ fill: '#8c8a80', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8c8a80', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Assets by Category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.assetsByCategory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" />
              <XAxis dataKey="name" tick={{ fill: '#8c8a80', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: '#8c8a80', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8c8a80', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar yAxisId="left" dataKey="count" name="Count" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="cost" name="Total Cost (&#8377;)" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Maintenance by Priority">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data?.maintenanceTrend} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {data?.maintenanceTrend.map((_, i) => <Cell key={i} fill={['#a8a69b', '#d97706', '#ea580c', '#e11d48'][i % 4]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Allocation Status Breakdown">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data?.allocationTrend} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" />
            <XAxis type="number" tick={{ fill: '#8c8a80', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#8c8a80', fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Most used vs idle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Most-Used Assets" subtitle="Ranked by lifetime allocations">
          {!data?.mostUsed?.length ? (
            <EmptyState icon={TrendingUp} title="No allocation history yet" compact />
          ) : (
            <div className="space-y-3">
              {data.mostUsed.map((a, i) => {
                const max = data.mostUsed[0].count || 1
                return (
                  <div key={a.assetTag + i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] text-[#57564f] truncate pr-3">{a.name} <span className="font-mono text-[11px] text-[#a8a69b]">{a.assetTag}</span></span>
                      <span className="text-[13px] font-semibold text-[#1c1b18]">{a.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#f0eee9] overflow-hidden">
                      <div className="h-full rounded-full bg-teal-500 transition-[width] duration-700" style={{ width: `${(a.count / max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card title="Idle Assets" subtitle="Available but never allocated">
          {!data?.idleAssets?.length ? (
            <EmptyState icon={Moon} title="No idle assets" description="Every available asset has been used." compact />
          ) : (
            <div className="divide-y divide-[#f0eee9]">
              {data.idleAssets.map((a, i) => (
                <div key={a.assetTag + i} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0">
                    <div className="text-[13px] text-[#1c1b18] truncate">{a.name}</div>
                    <div className="text-[11px] text-[#a8a69b]">{a.category}</div>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-700 shrink-0">{a.assetTag}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Maintenance frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Maintenance Frequency by Category">
          {!data?.maintenanceByCategory?.length ? (
            <EmptyState icon={Wrench} title="No maintenance recorded" compact />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.maintenanceByCategory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" />
                <XAxis dataKey="name" tick={{ fill: '#8c8a80', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8c8a80', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Requests" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Most-Serviced Assets" subtitle="Highest maintenance count">
          {!data?.maintenanceByAsset?.length ? (
            <EmptyState icon={Wrench} title="No maintenance recorded" compact />
          ) : (
            <div className="divide-y divide-[#f0eee9]">
              {data.maintenanceByAsset.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <span className="text-[13px] text-[#57564f] truncate pr-3">{a.name}</span>
                  <span className="text-[13px] font-semibold text-[#1c1b18]">{a.count} request{a.count === 1 ? '' : 's'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Warranty & retirement */}
      <Card title="Warranty & Retirement" subtitle="Assets with expired or expiring warranty">
        {!data?.warrantyAlerts?.length ? (
          <EmptyState icon={ShieldAlert} title="No warranty alerts" description="No assets are nearing warranty expiry." compact />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-[#8c8a80] uppercase tracking-wider border-b border-[#eceae4]">
                  <th className="py-2 pr-4">Asset</th><th className="py-2 pr-4">Tag</th><th className="py-2 pr-4">Warranty Expiry</th><th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee9]">
                {data.warrantyAlerts.map((a, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-4 text-[#1c1b18]">{a.name}</td>
                    <td className="py-2.5 pr-4 font-mono text-[12px] text-emerald-700">{a.assetTag}</td>
                    <td className="py-2.5 pr-4 text-[#57564f]">{formatDate(a.warrantyExpiry)}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${a.status === 'EXPIRED' ? 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/15' : 'text-amber-700 bg-amber-50 ring-1 ring-amber-600/15'}`}>
                        {a.status === 'EXPIRED' ? 'Expired' : `Expiring · ${a.daysLeft}d`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Booking heatmap */}
      <Card title="Resource Booking Heatmap" subtitle="Peak usage windows by weekday and hour">
        {!data || data.bookingHeatmap.max === 0 ? (
          <EmptyState icon={TrendingUp} title="No bookings yet" description="Booking activity will map here." compact />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="flex gap-1 pl-10 mb-1">
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="flex-1 text-center text-[9px] text-[#a8a69b]">{h % 3 === 0 ? h : ''}</div>
                ))}
              </div>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, d) => (
                <div key={day} className="flex items-center gap-1 mb-1">
                  <div className="w-9 text-[11px] text-[#8c8a80] shrink-0">{day}</div>
                  {data.bookingHeatmap.matrix[d].map((v, h) => {
                    const intensity = data.bookingHeatmap.max ? v / data.bookingHeatmap.max : 0
                    return (
                      <div
                        key={h}
                        title={`${day} ${h}:00 — ${v} booking${v === 1 ? '' : 's'}`}
                        className="flex-1 h-5 rounded-[3px]"
                        style={{ background: v === 0 ? '#f4f3ef' : `rgba(5,150,105,${0.15 + intensity * 0.8})` }}
                      />
                    )
                  })}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-3 pl-10 text-[11px] text-[#a8a69b]">
                <span>Less</span>
                {[0.15, 0.4, 0.65, 0.95].map((o, i) => (
                  <span key={i} className="h-3 w-5 rounded-[3px]" style={{ background: `rgba(5,150,105,${o})` }} />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
