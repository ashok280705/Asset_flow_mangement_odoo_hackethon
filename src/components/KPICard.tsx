import { cn } from '@/lib/utils'
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { AnimatedCounter } from '@/components/ui/AnimatedCounter'
import { WidgetMenu, type WidgetMenuItem } from '@/components/ui/WidgetMenu'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: { value: number; label: string }
  menu?: WidgetMenuItem[]
  className?: string
}

// Maps the legacy dark icon-color tokens (still passed by pages) to a
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
  menu,
  className,
}: KPICardProps) {
  const isNumber = typeof value === 'number'
  const up = trend ? trend.value >= 0 : true

  return (
    <div
      className={cn('af-widget af-widget--interactive p-5 flex flex-col gap-4', className)}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#8c8a80]">{title}</span>
        <div className="flex items-center gap-1">
          <div className={cn('grid place-items-center h-9 w-9 rounded-[12px]', iconChip(iconColor))}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>
          {menu && menu.length > 0 && <WidgetMenu items={menu} className="-mr-1" />}
        </div>
      </div>

      <div>
        <div className="text-[30px] leading-none font-semibold text-[#1c1b18] tracking-tight af-num">
          {isNumber ? <AnimatedCounter value={value as number} /> : value}
        </div>
        {subtitle && <div className="text-[13px] text-[#8c8a80] mt-2">{subtitle}</div>}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11.5px] font-semibold',
              up ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
            )}
          >
            {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-[12px] text-[#8c8a80]">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
