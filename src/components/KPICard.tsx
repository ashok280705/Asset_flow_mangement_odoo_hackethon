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
// premium light treatment — a tinted icon chip plus a matching accent strip
// so a row of KPI cards reads as a colourful, differentiated set (not all green).
const TONE_MAP: Record<string, { chip: string; strip: string; dot: string }> = {
  'text-amber-400': { chip: 'bg-amber-50 text-amber-600', strip: 'bg-amber-400/70', dot: 'bg-amber-400' },
  'text-emerald-400': { chip: 'bg-emerald-50 text-emerald-600', strip: 'bg-emerald-400/70', dot: 'bg-emerald-400' },
  'text-blue-400': { chip: 'bg-teal-50 text-teal-600', strip: 'bg-teal-400/70', dot: 'bg-teal-400' },
  'text-orange-400': { chip: 'bg-orange-50 text-orange-600', strip: 'bg-orange-400/70', dot: 'bg-orange-400' },
  'text-red-400': { chip: 'bg-rose-50 text-rose-600', strip: 'bg-rose-400/70', dot: 'bg-rose-400' },
  'text-purple-400': { chip: 'bg-violet-50 text-violet-600', strip: 'bg-violet-400/70', dot: 'bg-violet-400' },
  'text-slate-400': { chip: 'bg-stone-100 text-stone-500', strip: 'bg-stone-300', dot: 'bg-stone-400' },
}
function tone(iconColor?: string) {
  return TONE_MAP[iconColor || ''] || TONE_MAP['text-emerald-400']
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
  const t = tone(iconColor)

  return (
    <div
      className={cn('af-widget af-widget--interactive p-5 pt-[18px] flex flex-col gap-4', className)}
    >
      {/* colored accent strip so each KPI reads distinctly */}
      <span className={cn('absolute top-0 left-5 right-5 h-[3px] rounded-b-full', t.strip)} aria-hidden />
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#8c8a80]">{title}</span>
        <div className="flex items-center gap-1">
          <div className={cn('grid place-items-center h-9 w-9 rounded-[12px]', t.chip)}>
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
