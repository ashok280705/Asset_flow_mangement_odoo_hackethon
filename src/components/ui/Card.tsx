import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export function Card({ className, children, title, subtitle, action }: CardProps) {
  return (
    <div className={cn('bg-slate-800 border border-slate-700/50 rounded-xl', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
