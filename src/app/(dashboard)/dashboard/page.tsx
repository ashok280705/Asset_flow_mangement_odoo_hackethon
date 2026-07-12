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

const COLORS = ['#059669', '#0d9488', '#d97706', '#7c6f9f', '#e11d48', '#57564f', '#14b8a6', '#65a30d']

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
        <div className="text-[#8c8a80] animate-pulse">Loading dashboard...</div>
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="space-y-8 af-fade-in">
      <div>
        <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Dashboard</h1>
        <p className="text-[#8c8a80] text-[14px] mt-1">Asset & resource overview</p>
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
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e9e7e1', borderRadius: '12px', color: '#1c1b18', boxShadow: '0 8px 24px rgba(28,27,24,0.10)', fontSize: '12px' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Assets by Status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.charts.byStatus} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceae4" />
              <XAxis dataKey="name" tick={{ fill: '#8c8a80', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8c8a80', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e9e7e1', borderRadius: '12px', color: '#1c1b18', boxShadow: '0 8px 24px rgba(28,27,24,0.10)', fontSize: '12px' }}
              />
              <Bar dataKey="value" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Recent Activity">
        <div className="space-y-3">
          {data?.recentActivity.length === 0 && (
            <p className="text-[#8c8a80] text-sm text-center py-8">No recent activity</p>
          )}
          {data?.recentActivity.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#faf9f6]">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#57564f]">
                  <span className="font-medium text-[#1c1b18]">{log.user?.name}</span>{' '}
                  <span className="text-emerald-700">{log.action}</span>{' '}
                  {log.entity}
                  {log.details && <span className="text-[#8c8a80]"> — {log.details}</span>}
                </div>
                <div className="text-xs text-[#a8a69b] mt-0.5">{formatDateTime(log.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
