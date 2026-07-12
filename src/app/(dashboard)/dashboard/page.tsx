'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { KPICard } from '@/components/KPICard'
import { usePermissions } from '@/components/SessionProvider'
import { Widget } from '@/components/ui/Widget'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonStat, SkeletonWidget } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import {
  Package,
  CheckCircle,
  Users,
  Wrench,
  AlertTriangle,
  Calendar,
  ClipboardList,
  TrendingUp,
  Gauge,
  ShieldCheck,
  Zap,
  Activity,
  History,
  PlusCircle,
  BarChart3,
  ArrowRight,
  RefreshCw,
  GripVertical,
  Layers,
  CircleDot,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const DONUT_COLORS = ['#059669', '#0d9488', '#d97706', '#7c6f9f', '#e11d48', '#57564f', '#14b8a6', '#65a30d']
const BAR_COLORS = ['#059669', '#0d9488', '#d97706', '#7c6f9f', '#e11d48', '#14b8a6', '#65a30d', '#a16207']

interface StatsData {
  stats: {
    totalAssets: number
    availableAssets: number
    allocatedAssets: number
    underMaintenance: number
    activeAllocations: number
    overdueAllocations: number
    pendingMaintenance: number
    maintenanceToday: number
    upcomingBookings: number
    pendingTransfers: number
    upcomingReturns: number
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

// ── timeline dot colour by action verb ────────────────────────────────
function activityTone(action: string): string {
  const a = action.toLowerCase()
  if (a.includes('creat') || a.includes('add') || a.includes('register')) return 'bg-emerald-500'
  if (a.includes('allocat') || a.includes('assign') || a.includes('book')) return 'bg-teal-500'
  if (a.includes('return') || a.includes('close') || a.includes('complet')) return 'bg-stone-400'
  if (a.includes('maintenance') || a.includes('repair')) return 'bg-amber-500'
  if (a.includes('delet') || a.includes('remov') || a.includes('reject') || a.includes('lost')) return 'bg-rose-500'
  if (a.includes('updat') || a.includes('edit') || a.includes('transfer')) return 'bg-violet-500'
  return 'bg-emerald-500'
}

function relTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return ''
  }
}

// ── drag-to-reorder KPI grid (frontend-only, persisted to localStorage) ─
const DEFAULT_ORDER = ['total', 'available', 'allocated', 'maintenance']

export default function DashboardPage() {
  const router = useRouter()
  const { isManager, isApprover } = usePermissions()
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER)
  const dragItem = useRef<string | null>(null)

  const load = useCallback(async (soft = false) => {
    if (soft) setRefreshing(true)
    try {
      const res = await fetch('/api/dashboard/stats')
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    try {
      const saved = localStorage.getItem('af:dash-kpi-order')
      if (saved) {
        const arr = JSON.parse(saved) as string[]
        if (Array.isArray(arr) && arr.length === DEFAULT_ORDER.length) setOrder(arr)
      }
    } catch {}
  }, [load])

  function persistOrder(next: string[]) {
    setOrder(next)
    try {
      localStorage.setItem('af:dash-kpi-order', JSON.stringify(next))
    } catch {}
  }

  function onDrop(target: string) {
    const from = dragItem.current
    dragItem.current = null
    if (!from || from === target) return
    const next = [...order]
    next.splice(next.indexOf(from), 1)
    next.splice(next.indexOf(target), 0, from)
    persistOrder(next)
  }

  const s = data?.stats
  const total = s?.totalAssets ?? 0

  // ── honest derived metrics ──────────────────────────────────────────
  const utilization = total ? Math.round(((s?.allocatedAssets ?? 0) / total) * 100) : 0
  const availableRate = total ? Math.round(((s?.availableAssets ?? 0) / total) * 100) : 0
  const maintenanceRate = total ? (s?.underMaintenance ?? 0) / total : 0
  const overdueRatio = s?.activeAllocations ? (s.overdueAllocations ?? 0) / s.activeAllocations : 0
  const healthScore = Math.max(
    0,
    Math.min(100, Math.round(100 - maintenanceRate * 40 - overdueRatio * 30))
  )
  const healthBand =
    healthScore >= 85 ? { label: 'Excellent', color: '#059669' }
    : healthScore >= 70 ? { label: 'Good', color: '#0d9488' }
    : healthScore >= 50 ? { label: 'Fair', color: '#d97706' }
    : { label: 'Needs attention', color: '#e11d48' }

  const kpiConfig = useMemo(() => ({
    total: { title: 'Total Assets', value: s?.totalAssets ?? 0, icon: Package, iconColor: 'text-amber-400', subtitle: 'Registered in system' },
    available: { title: 'Available', value: s?.availableAssets ?? 0, icon: CheckCircle, iconColor: 'text-emerald-400', subtitle: 'Ready to allocate' },
    allocated: { title: 'Allocated', value: s?.allocatedAssets ?? 0, icon: Users, iconColor: 'text-blue-400', subtitle: 'Currently in use' },
    maintenance: { title: 'In Maintenance', value: s?.underMaintenance ?? 0, icon: Wrench, iconColor: 'text-orange-400', subtitle: 'Under repair' },
  }), [s]) as Record<string, { title: string; value: number; icon: typeof Package; iconColor: string; subtitle: string }>

  const attentionItems = [
    { label: 'Overdue returns', value: s?.overdueAllocations ?? 0, href: '/allocations', tone: 'rose', icon: AlertTriangle },
    { label: 'Pending maintenance', value: s?.pendingMaintenance ?? 0, href: '/maintenance', tone: 'amber', icon: Wrench },
    { label: 'Under repair', value: s?.underMaintenance ?? 0, href: '/maintenance', tone: 'orange', icon: ClipboardList },
  ] as const

  // Quick actions adapt to what the role can actually do.
  const quickActions = isManager
    ? [
        { label: 'Register asset', href: '/assets/register', icon: PlusCircle },
        { label: 'Allocations', href: '/allocations', icon: Users },
        { label: 'New booking', href: '/bookings', icon: Calendar },
        { label: 'Log maintenance', href: '/maintenance', icon: Wrench },
        { label: 'Start audit', href: '/audits', icon: ClipboardList },
        { label: 'View reports', href: '/reports', icon: BarChart3 },
      ]
    : [
        { label: 'My assets', href: '/assets', icon: Package },
        { label: 'Book resource', href: '/bookings', icon: Calendar },
        { label: 'Raise maintenance', href: '/maintenance', icon: Wrench },
        { label: 'My allocations', href: '/allocations', icon: Users },
        ...(isApprover ? [{ label: 'View reports', href: '/reports', icon: BarChart3 }] : []),
      ]

  const maxCategory = Math.max(1, ...(data?.charts.byCategory.map((c) => c.value) ?? [1]))
  const statusTotal = (data?.charts.byStatus.reduce((a, b) => a + b.value, 0)) || 0

  // ── loading skeleton screen ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="af-skeleton h-7 w-48" />
          <div className="af-skeleton h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <SkeletonWidget className="lg:col-span-4" />
          <SkeletonWidget className="lg:col-span-4" />
          <SkeletonWidget className="lg:col-span-4" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <SkeletonWidget className="lg:col-span-8" />
          <SkeletonWidget className="lg:col-span-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[27px] font-semibold text-[#1c1b18] tracking-tight">Dashboard</h1>
          <p className="text-[#8c8a80] text-[14px] mt-1">Asset &amp; resource overview at a glance</p>
        </div>
        <button
          onClick={() => load(true)}
          className="hidden sm:inline-flex items-center gap-2 h-9 px-3.5 bg-white border border-[#e6e4dd] rounded-xl text-[13px] font-medium text-[#57564f] shadow-xs hover:border-[#d3d0c8] hover:text-[#1c1b18] transition-all"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* KPI row — draggable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 af-stagger">
        {order.map((key) => {
          const cfg = kpiConfig[key]
          if (!cfg) return null
          return (
            <div
              key={key}
              draggable
              onDragStart={() => (dragItem.current = key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(key)}
              className="group relative cursor-default"
            >
              <span className="hidden lg:flex absolute top-1 left-1/2 -translate-x-1/2 z-10 h-5 w-7 items-center justify-center text-[#c9c6bd] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" title="Drag to reorder">
                <GripVertical className="h-4 w-4" />
              </span>
              <KPICard
                title={cfg.title}
                value={cfg.value}
                icon={cfg.icon}
                iconColor={cfg.iconColor}
                subtitle={cfg.subtitle}
                menu={[
                  { label: 'View assets', icon: Package, onSelect: () => router.push('/assets') },
                  { label: 'Refresh data', icon: RefreshCw, onSelect: () => load(true) },
                ]}
              />
            </div>
          )
        })}
      </div>

      {/* Bento row 1 — utilization / health / quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Utilization */}
        <Widget
          title="Utilization"
          subtitle="Assets currently in use"
          icon={Gauge}
          tone="teal"
          className="lg:col-span-4"
          menu={[{ label: 'View allocations', icon: Users, onSelect: () => router.push('/allocations') }]}
        >
          <div className="flex items-center gap-5">
            <ProgressRing value={utilization} size={124} color="#0d9488">
              <div>
                <div className="text-[26px] font-semibold text-[#1c1b18] leading-none af-num">
                  <AnimatedCounter value={utilization} suffix="%" />
                </div>
                <div className="text-[11px] text-[#8c8a80] mt-1">in use</div>
              </div>
            </ProgressRing>
            <div className="flex-1 space-y-2.5 min-w-0">
              <UtilRow label="In use" value={s?.allocatedAssets ?? 0} dot="bg-teal-500" />
              <UtilRow label="Available" value={s?.availableAssets ?? 0} dot="bg-emerald-500" />
              <UtilRow label="Maintenance" value={s?.underMaintenance ?? 0} dot="bg-amber-500" />
            </div>
          </div>
        </Widget>

        {/* Fleet Health */}
        <Widget
          title="Fleet Health Index"
          subtitle="Composite readiness score"
          icon={ShieldCheck}
          tone="emerald"
          className="lg:col-span-4"
        >
          <div className="flex items-center gap-5">
            <ProgressRing value={healthScore} size={124} color={healthBand.color}>
              <div>
                <div className="text-[26px] font-semibold text-[#1c1b18] leading-none af-num">
                  <AnimatedCounter value={healthScore} />
                </div>
                <div className="text-[11px] font-medium mt-1" style={{ color: healthBand.color }}>
                  {healthBand.label}
                </div>
              </div>
            </ProgressRing>
            <div className="flex-1 space-y-2.5 min-w-0">
              <UtilRow label="Availability" value={`${availableRate}%`} dot="bg-emerald-500" />
              <UtilRow label="Overdue returns" value={s?.overdueAllocations ?? 0} dot="bg-rose-500" />
              <UtilRow label="In maintenance" value={s?.underMaintenance ?? 0} dot="bg-amber-500" />
            </div>
          </div>
        </Widget>

        {/* Quick actions */}
        <Widget title="Quick Actions" icon={Zap} tone="amber" className="lg:col-span-4">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((a) => {
              const Icon = a.icon
              return (
                <Link
                  key={a.label}
                  href={a.href}
                  className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-[#eceae4] bg-[#faf9f6] hover:bg-white hover:border-[#ddd9d1] hover:shadow-sm transition-all"
                >
                  <span className="grid place-items-center h-8 w-8 rounded-[10px] bg-white text-[#57564f] border border-[#eceae4] group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors shrink-0">
                    <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
                  </span>
                  <span className="text-[12.5px] font-medium text-[#1c1b18] leading-tight">{a.label}</span>
                </Link>
              )
            })}
          </div>
        </Widget>
      </div>

      {/* Operational stat tiles — the PDF's KPI set (overdue is highlighted separately below) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="Maintenance Today" value={s?.maintenanceToday ?? 0} icon={Wrench} tone="orange" href="/maintenance" />
        <MiniStat label="Active Bookings" value={s?.upcomingBookings ?? 0} icon={Calendar} tone="teal" href="/bookings" />
        <MiniStat label="Pending Transfers" value={s?.pendingTransfers ?? 0} icon={RefreshCw} tone="violet" href="/allocations" />
        <MiniStat label="Upcoming Returns" value={s?.upcomingReturns ?? 0} icon={TrendingUp} tone="amber" href="/allocations" />
      </div>

      {/* Bento row 2 — distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Status distribution */}
        <Widget
          title="Status Distribution"
          subtitle={`${statusTotal} assets across ${data?.charts.byStatus.length ?? 0} states`}
          icon={CircleDot}
          tone="violet"
          className="lg:col-span-5"
          menu={[{ label: 'Open reports', icon: BarChart3, onSelect: () => router.push('/reports') }]}
        >
          {(!data?.charts.byStatus || data.charts.byStatus.length === 0) ? (
            <EmptyState icon={CircleDot} title="No status data" description="Register assets to see their distribution." compact />
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative shrink-0" style={{ width: 176, height: 176 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.byStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.charts.byStatus.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e9e7e1', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,27,24,0.10)', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-[24px] font-semibold text-[#1c1b18] leading-none af-num">
                      <AnimatedCounter value={statusTotal} />
                    </div>
                    <div className="text-[11px] text-[#8c8a80] mt-1">total</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {data.charts.byStatus.map((st, i) => (
                  <div key={st.name} className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-[12.5px] text-[#57564f] capitalize truncate flex-1">{st.name.toLowerCase()}</span>
                    <span className="text-[12.5px] font-semibold text-[#1c1b18] af-num">{st.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Widget>

        {/* Category distribution — clean horizontal bars */}
        <Widget
          title="Assets by Category"
          subtitle="Distribution across categories"
          icon={Layers}
          tone="teal"
          className="lg:col-span-7"
          menu={[{ label: 'Open reports', icon: BarChart3, onSelect: () => router.push('/reports') }]}
        >
          {(!data?.charts.byCategory || data.charts.byCategory.length === 0) ? (
            <EmptyState icon={Layers} title="No categories yet" description="Add categories in Setup to organise your assets." compact />
          ) : (
            <div className="space-y-3.5 pt-1">
              {data.charts.byCategory.slice(0, 7).map((c, i) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] text-[#57564f] truncate pr-3">{c.name}</span>
                    <span className="text-[13px] font-semibold text-[#1c1b18] af-num">{c.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f0eee9] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{ width: `${(c.value / maxCategory) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Widget>
      </div>

      {/* Bento row 3 — activity timeline + attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent activity timeline */}
        <Widget
          title="Recent Activity"
          subtitle="Latest actions across the workspace"
          icon={History}
          tone="emerald"
          className="lg:col-span-8"
          action={
            <Link href="/reports" className="hidden sm:inline-flex items-center gap-1 text-[12.5px] font-medium text-emerald-700 hover:text-emerald-800 transition-colors">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {(!data?.recentActivity || data.recentActivity.length === 0) ? (
            <EmptyState icon={Activity} title="No activity yet" description="Actions like allocations, returns and maintenance will appear here." compact />
          ) : (
            <ol className="relative">
              {/* connecting rail */}
              <span className="absolute left-[6px] top-2 bottom-2 w-px bg-[#eceae4]" aria-hidden />
              {data.recentActivity.map((log) => (
                <li key={log.id} className="relative flex gap-4 pl-6 py-2.5 first:pt-1 last:pb-1">
                  <span className={cn('absolute left-0 top-[15px] h-[13px] w-[13px] rounded-full ring-4 ring-white', activityTone(log.action))} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#57564f] leading-snug">
                      <span className="font-semibold text-[#1c1b18]">{log.user?.name ?? 'Someone'}</span>{' '}
                      <span className="text-emerald-700">{log.action}</span>{' '}
                      <span className="text-[#57564f]">{log.entity}</span>
                      {log.details && <span className="text-[#8c8a80]"> — {log.details}</span>}
                    </p>
                    <span className="text-[11.5px] text-[#a8a69b] mt-0.5 inline-block">{relTime(log.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Widget>

        {/* Needs attention */}
        <Widget title="Needs Attention" subtitle="Items to review" icon={AlertTriangle} tone="rose" className="lg:col-span-4">
          <div className="space-y-2.5">
            {attentionItems.every((a) => a.value === 0) ? (
              <EmptyState icon={ShieldCheck} title="All clear" description="Nothing needs your attention right now." compact />
            ) : (
              attentionItems.map((a) => {
                const Icon = a.icon
                const tones: Record<string, string> = {
                  rose: 'bg-rose-50 text-rose-600',
                  amber: 'bg-amber-50 text-amber-600',
                  orange: 'bg-orange-50 text-orange-600',
                }
                return (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-[#eceae4] hover:border-[#ddd9d1] hover:bg-[#faf9f6] transition-all"
                  >
                    <span className={cn('grid place-items-center h-9 w-9 rounded-[11px] shrink-0', tones[a.tone])}>
                      <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
                    </span>
                    <span className="flex-1 text-[13px] font-medium text-[#1c1b18]">{a.label}</span>
                    <span className="text-[18px] font-semibold text-[#1c1b18] af-num">
                      <AnimatedCounter value={a.value} />
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#c9c6bd] group-hover:text-[#8c8a80] group-hover:translate-x-0.5 transition-all" />
                  </Link>
                )
              })
            )}
          </div>
        </Widget>
      </div>
    </div>
  )
}

// ── small presentational helpers ──────────────────────────────────────
function UtilRow({ label, value, dot }: { label: string; value: number | string; dot: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', dot)} />
      <span className="text-[12.5px] text-[#57564f] flex-1 truncate">{label}</span>
      <span className="text-[13px] font-semibold text-[#1c1b18] af-num">{value}</span>
    </div>
  )
}

function MiniStat({
  label, value, icon: Icon, tone, href,
}: {
  label: string; value: number; icon: typeof Package; tone: 'emerald' | 'rose' | 'orange' | 'violet' | 'teal' | 'amber'; href: string
}) {
  const tones: Record<string, { chip: string; strip: string }> = {
    emerald: { chip: 'bg-emerald-50 text-emerald-600', strip: 'bg-emerald-400/70' },
    rose: { chip: 'bg-rose-50 text-rose-600', strip: 'bg-rose-400/70' },
    orange: { chip: 'bg-orange-50 text-orange-600', strip: 'bg-orange-400/70' },
    violet: { chip: 'bg-violet-50 text-violet-600', strip: 'bg-violet-400/70' },
    teal: { chip: 'bg-teal-50 text-teal-600', strip: 'bg-teal-400/70' },
    amber: { chip: 'bg-amber-50 text-amber-600', strip: 'bg-amber-400/70' },
  }
  return (
    <Link href={href} className="af-widget af-widget--interactive p-4 flex items-center gap-3.5">
      <span className={cn('absolute top-0 left-4 right-4 h-[3px] rounded-b-full', tones[tone].strip)} aria-hidden />
      <span className={cn('grid place-items-center h-11 w-11 rounded-[13px] shrink-0', tones[tone].chip)}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="text-[22px] font-semibold text-[#1c1b18] leading-none af-num">
          <AnimatedCounter value={value} />
        </div>
        <div className="text-[12px] text-[#8c8a80] mt-1 truncate">{label}</div>
      </div>
    </Link>
  )
}
