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

// Maps the old dark icon-color tokens (still passed by pages) to a
// premium light "tinted chip" treatment so callers need no changes.
function iconChip(iconColor?: string): string {
  const map: Record<string, string> = {
    'text-amber-400': 'bg-amber-50 text-amber-600',
    'text-emerald-400': 'bg-emerald-50 text-emerald-600',
    'text-blue-400': 'bg-teal-50 text-teal-600',
    'text-orange-400': 'bg-orange-50 text-orange-600',
    'text-red-400': 'bg-rose-50 text-rose-600',
    'text-purple-400': 'bg-violet-50 text-violet-600',
    'text-slate-400': 'bg-stone-100 text-stone-500',
  }
  return map[iconColor || ''] || 'bg-emerald-50 text-emerald-600'
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  trend,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-[#e9e7e1] rounded-2xl shadow-soft af-hover-lift p-5 flex flex-col gap-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#8c8a80]">{title}</span>
        <div className={cn('p-2 rounded-[10px]', iconChip(iconColor))}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
      </div>
      <div>
        <div className="text-[28px] leading-none font-semibold text-[#1c1b18] tracking-tight">{value}</div>
        {subtitle && <div className="text-[13px] text-[#8c8a80] mt-1.5">{subtitle}</div>}
      </div>
      {trend && (
        <div
          className={cn(
            'text-xs font-medium',
            trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'
          )}
        >
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  )
}
