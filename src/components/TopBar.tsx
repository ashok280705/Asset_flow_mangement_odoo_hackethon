'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell } from 'lucide-react'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  assets: 'Assets',
  register: 'Register',
  allocations: 'Allocations',
  bookings: 'Bookings',
  maintenance: 'Maintenance',
  audits: 'Audits',
  reports: 'Reports',
  notifications: 'Notifications',
  setup: 'Organization Setup',
}

interface TopBarProps {
  user: { name: string; email: string; role: string }
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#f6f5f2]/80 backdrop-blur-md border-b border-[#eceae4] flex items-center gap-4 px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[13px] min-w-0" aria-label="Breadcrumb">
        <Link href="/dashboard" className="text-[#a8a69b] hover:text-[#57564f] transition-colors">
          AssetFlow
        </Link>
        {segments.map((seg, i) => {
          const href = '/' + segments.slice(0, i + 1).join('/')
          const isLast = i === segments.length - 1
          return (
            <span key={href} className="flex items-center gap-1.5 min-w-0">
              <span className="text-[#d3d0c8]">/</span>
              {isLast ? (
                <span className="font-medium text-[#1c1b18] truncate">
                  {LABELS[seg] || seg.replace(/-/g, ' ')}
                </span>
              ) : (
                <Link href={href} className="text-[#a8a69b] hover:text-[#57564f] transition-colors capitalize truncate">
                  {LABELS[seg] || seg.replace(/-/g, ' ')}
                </Link>
              )}
            </span>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a8a69b]" />
        <input
          type="text"
          placeholder="Search…"
          className="w-full h-9 pl-9 pr-3 bg-white border border-[#e6e4dd] rounded-xl text-[13px] text-[#1c1b18] placeholder-[#a8a69b] shadow-xs focus:outline-none focus:ring-[3px] focus:ring-emerald-600/15 focus:border-emerald-400 transition-all"
        />
      </div>

      {/* Notifications */}
      <Link
        href="/notifications"
        aria-label="Notifications"
        className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-[#e6e4dd] text-[#57564f] hover:text-[#1c1b18] hover:border-[#d3d0c8] shadow-xs transition-all"
      >
        <Bell className="h-[17px] w-[17px]" />
        <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      </Link>

      {/* Profile */}
      <div className="flex items-center gap-2.5 pl-1">
        <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[13px] font-semibold">
          {initials}
        </div>
        <div className="hidden lg:block leading-tight">
          <div className="text-[13px] font-medium text-[#1c1b18]">{user.name}</div>
          <div className="text-[11px] text-[#a8a69b] capitalize">{user.role.replace(/_/g, ' ').toLowerCase()}</div>
        </div>
      </div>
    </header>
  )
}
