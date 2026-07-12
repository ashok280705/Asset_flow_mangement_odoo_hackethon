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
  const colors: Record<string, string> = {
    AVAILABLE: 'text-emerald-400 bg-emerald-400/10',
    ALLOCATED: 'text-amber-400 bg-amber-400/10',
    RESERVED: 'text-blue-400 bg-blue-400/10',
    UNDER_MAINTENANCE: 'text-orange-400 bg-orange-400/10',
    LOST: 'text-red-400 bg-red-400/10',
    RETIRED: 'text-slate-400 bg-slate-400/10',
    DISPOSED: 'text-slate-500 bg-slate-500/10',
    ACTIVE: 'text-emerald-400 bg-emerald-400/10',
    INACTIVE: 'text-slate-400 bg-slate-400/10',
    PENDING: 'text-amber-400 bg-amber-400/10',
    APPROVED: 'text-emerald-400 bg-emerald-400/10',
    REJECTED: 'text-red-400 bg-red-400/10',
    RESOLVED: 'text-emerald-400 bg-emerald-400/10',
    IN_PROGRESS: 'text-blue-400 bg-blue-400/10',
    UPCOMING: 'text-blue-400 bg-blue-400/10',
    ONGOING: 'text-emerald-400 bg-emerald-400/10',
    COMPLETED: 'text-slate-400 bg-slate-400/10',
    CANCELLED: 'text-red-400 bg-red-400/10',
    OVERDUE: 'text-red-400 bg-red-400/10',
    RETURNED: 'text-slate-400 bg-slate-400/10',
    OPEN: 'text-blue-400 bg-blue-400/10',
    CLOSED: 'text-slate-400 bg-slate-400/10',
  }
  return colors[status] || 'text-slate-400 bg-slate-400/10'
}
