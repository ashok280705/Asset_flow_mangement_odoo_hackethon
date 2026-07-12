import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'
import { WidgetMenu, type WidgetMenuItem } from './WidgetMenu'

type Tone = 'emerald' | 'amber' | 'teal' | 'orange' | 'rose' | 'violet' | 'slate'

const TONE_CHIP: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  teal: 'bg-teal-50 text-teal-600',
  orange: 'bg-orange-50 text-orange-600',
  rose: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
  slate: 'bg-stone-100 text-stone-500',
}

interface WidgetProps {
  title?: string
  subtitle?: string
  icon?: LucideIcon
  tone?: Tone
  menu?: WidgetMenuItem[]
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  interactive?: boolean
  children: React.ReactNode
}

/**
 * The canonical bento widget surface. Consistent header (icon chip + title
 * + optional ⋮ menu / action) and body padding, so a page full of these
 * reads as one system.
 */
export function Widget({
  title,
  subtitle,
  icon: Icon,
  tone = 'emerald',
  menu,
  action,
  className,
  bodyClassName,
  interactive,
  children,
}: WidgetProps) {
  const hasHeader = title || Icon || menu || action
  return (
    <section
      className={cn('af-widget', interactive && 'af-widget--interactive', className)}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <span className={cn('grid place-items-center h-9 w-9 rounded-[12px] shrink-0', TONE_CHIP[tone])}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-[14px] font-semibold text-[#1c1b18] leading-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[12px] text-[#8c8a80] mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {action}
            {menu && menu.length > 0 && <WidgetMenu items={menu} />}
          </div>
        </header>
      )}
      <div className={cn('px-5 pb-5', hasHeader ? 'pt-4' : 'pt-5', bodyClassName)}>
        {children}
      </div>
    </section>
  )
}
