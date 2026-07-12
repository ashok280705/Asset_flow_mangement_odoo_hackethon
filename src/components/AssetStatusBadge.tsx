import { Badge } from '@/components/ui/Badge'

interface AssetStatusBadgeProps {
  status: string
  className?: string
}

export function AssetStatusBadge({ status, className }: AssetStatusBadgeProps) {
  const labels: Record<string, string> = {
    AVAILABLE: 'Available',
    ALLOCATED: 'Allocated',
    RESERVED: 'Reserved',
    UNDER_MAINTENANCE: 'Maintenance',
    LOST: 'Lost',
    RETIRED: 'Retired',
    DISPOSED: 'Disposed',
  }
  return <Badge status={status} label={labels[status] || status} className={className} />
}
