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
    <div className={cn('bg-white border border-[#e9e7e1] rounded-2xl shadow-soft', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#efede8]">
          <div>
            {title && <h3 className="text-[15px] font-semibold text-[#1c1b18]">{title}</h3>}
            {subtitle && <p className="text-[13px] text-[#8c8a80] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
