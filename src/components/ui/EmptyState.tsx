import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  /** compact variant for inside widgets */
  compact?: boolean
}

/**
 * Elegant, illustrated empty state. Uses a soft layered "halo" behind a
 * Lucide glyph — premium SaaS look, no stock imagery.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4 gap-2.5' : 'py-16 px-6 gap-3',
        className
      )}
    >
      {Icon && (
        <div className={cn('relative mb-1', compact ? 'h-14 w-14' : 'h-20 w-20')}>
          {/* concentric halos */}
          <span className="absolute inset-0 rounded-full bg-emerald-50/70" />
          <span className="absolute inset-[14%] rounded-full bg-emerald-100/60" />
          <span className="absolute inset-[30%] rounded-full bg-white ring-1 ring-emerald-600/10" />
          <span className="absolute inset-0 grid place-items-center text-emerald-600/80">
            <Icon className={compact ? 'h-6 w-6' : 'h-8 w-8'} strokeWidth={1.6} />
          </span>
        </div>
      )}
      <h3 className={cn('font-semibold text-[#1c1b18]', compact ? 'text-[14px]' : 'text-[16px]')}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-[#8c8a80] max-w-sm', compact ? 'text-[12.5px]' : 'text-[13.5px] leading-relaxed')}>
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
