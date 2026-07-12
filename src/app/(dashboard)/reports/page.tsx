'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

interface ReportData {
  assetsByStatus: { name: string; value: number }[]
  assetsByCategory: { name: string; count: number; cost: number }[]
  assetsByDept: { name: string; value: number }[]
  maintenanceTrend: { name: string; value: number }[]
  allocationTrend: { name: string; value: number }[]
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports/assets')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const tooltipStyle = { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading reports...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Analytics &amp; Reports</h1>
        <p className="text-slate-400 mt-1">Comprehensive asset management insights</p>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Assets by Category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.assetsByCategory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar yAxisId="left" dataKey="count" name="Count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="cost" name="Total Cost (&#8377;)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Maintenance by Priority">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data?.maintenanceTrend} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {data?.maintenanceTrend.map((_, i) => <Cell key={i} fill={['#64748b', '#f59e0b', '#f97316', '#ef4444'][i % 4]} />)}
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
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
