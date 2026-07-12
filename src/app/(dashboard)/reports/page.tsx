'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonWidget } from '@/components/ui/Skeleton'
import { usePermissions } from '@/components/SessionProvider'
import { Lock, Download } from 'lucide-react'
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
    </div>
  )
}
