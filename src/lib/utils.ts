import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateAssetTag(count: number): string {
  return `AF-${String(count).padStart(4, '0')}`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

export function getStatusColor(status: string): string {
  // Light-first badge tokens: soft tinted fill + darker on-tint text + hairline ring.
  const emerald = 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-600/15'
  const amber = 'text-amber-700 bg-amber-50 ring-1 ring-amber-600/15'
  const teal = 'text-teal-700 bg-teal-50 ring-1 ring-teal-600/15'
  const orange = 'text-orange-700 bg-orange-50 ring-1 ring-orange-600/15'
  const rose = 'text-rose-700 bg-rose-50 ring-1 ring-rose-600/15'
  const neutral = 'text-stone-600 bg-stone-100 ring-1 ring-stone-500/15'
  const purple = 'text-violet-700 bg-violet-50 ring-1 ring-violet-600/15'

  const colors: Record<string, string> = {
    AVAILABLE: emerald,
    ALLOCATED: amber,
    RESERVED: teal,
    UNDER_MAINTENANCE: orange,
    LOST: rose,
    RETIRED: neutral,
    DISPOSED: neutral,
    ACTIVE: emerald,
    INACTIVE: neutral,
    PENDING: amber,
    APPROVED: emerald,
    REJECTED: rose,
    RESOLVED: emerald,
    IN_PROGRESS: teal,
    TECHNICIAN_ASSIGNED: purple,
    UPCOMING: teal,
    ONGOING: emerald,
    COMPLETED: neutral,
    CANCELLED: rose,
    OVERDUE: rose,
    RETURNED: neutral,
    OPEN: teal,
    CLOSED: neutral,
    // conditions
    EXCELLENT: emerald,
    GOOD: emerald,
    FAIR: amber,
    POOR: orange,
    DAMAGED: rose,
    // priority
    LOW: neutral,
    MEDIUM: amber,
    HIGH: orange,
    CRITICAL: rose,
  }
  return colors[status] || neutral
}
