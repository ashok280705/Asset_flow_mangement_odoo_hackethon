'use client'
import { useEffect, useState } from 'react'
import { KPICard } from '@/components/KPICard'
import { Card } from '@/components/ui/Card'
import { formatDateTime } from '@/lib/utils'
import {
  Package,
  CheckCircle,
  Users,
  Wrench,
  AlertTriangle,
  Calendar,
  ClipboardList,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

interface StatsData {
  stats: {
    totalAssets: number
    availableAssets: number
    allocatedAssets: number
    underMaintenance: number
    activeAllocations: number
    overdueAllocations: number
    pendingMaintenance: number
    upcomingBookings: number
  }
  charts: {
    byCategory: { name: string; value: number }[]
    byStatus: { name: string; value: number }[]
  }
  recentActivity: {
    id: string
    action: string
    entity: string
    details: string
    createdAt: string
    user: { name: string }
  }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">Loading dashboard...</div>
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">Asset & resource overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Assets"
          value={stats?.totalAssets ?? 0}
          icon={Package}
          iconColor="text-amber-400"
          subtitle="Registered in system"
        />
        <KPICard
          title="Available"
          value={stats?.availableAssets ?? 0}
          icon={CheckCircle}
          iconColor="text-emerald-400"
          subtitle="Ready to allocate"
        />
        <KPICard
          title="Allocated"
          value={stats?.allocatedAssets ?? 0}
          icon={Users}
          iconColor="text-blue-400"
          subtitle="Currently in use"
        />
        <KPICard
          title="In Maintenance"
          value={stats?.underMaintenance ?? 0}
          icon={Wrench}
          iconColor="text-orange-400"
          subtitle="Under repair"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Allocations"
          value={stats?.activeAllocations ?? 0}
          icon={TrendingUp}
          iconColor="text-amber-400"
        />
        <KPICard
          title="Overdue Returns"
          value={stats?.overdueAllocations ?? 0}
          icon={AlertTriangle}
          iconColor="text-red-400"
        />
        <KPICard
          title="Pending Maintenance"
          value={stats?.pendingMaintenance ?? 0}
          icon={ClipboardList}
          iconColor="text-orange-400"
        />
        <KPICard
          title="Upcoming Bookings"
          value={stats?.upcomingBookings ?? 0}
          icon={Calendar}
          iconColor="text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Assets by Category">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data?.charts.byCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {data?.charts.byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Assets by Status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.charts.byStatus} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Recent Activity">
        <div className="space-y-3">
          {data?.recentActivity.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">No recent activity</p>
          )}
          {data?.recentActivity.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-300">
                  <span className="font-medium text-slate-100">{log.user?.name}</span>{' '}
                  <span className="text-amber-400">{log.action}</span>{' '}
                  {log.entity}
                  {log.details && <span className="text-slate-400"> — {log.details}</span>}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{formatDateTime(log.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
