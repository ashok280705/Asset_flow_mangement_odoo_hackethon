import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: { value: number; label: string }
  className?: string
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-amber-400',
  trend,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'bg-slate-800 border border-slate-700/50 rounded-xl p-6 flex flex-col gap-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className={cn('p-2 rounded-lg bg-slate-700/50', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-100">{value}</div>
        {subtitle && <div className="text-sm text-slate-400 mt-1">{subtitle}</div>}
      </div>
      {trend && (
        <div
          className={cn(
            'text-xs font-medium',
            trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  )
}
