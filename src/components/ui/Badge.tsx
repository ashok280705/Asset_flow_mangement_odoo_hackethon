import { cn } from '@/lib/utils'
import { getStatusColor } from '@/lib/utils'

interface BadgeProps {
  status: string
  label?: string
  className?: string
}

export function Badge({ status, label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-tight whitespace-nowrap',
        getStatusColor(status),
        className
      )}
    >
      {label || status.replace(/_/g, ' ')}
    </span>
  )
}
