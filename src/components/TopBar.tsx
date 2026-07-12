'use client'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell, Plus, PanelLeft } from 'lucide-react'
import { usePermissions } from '@/components/SessionProvider'

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

function openPalette() {
  window.dispatchEvent(new Event('assetflow:open-command-palette'))
}
function toggleSidebar() {
  window.dispatchEvent(new Event('assetflow:toggle-sidebar'))
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isManager } = usePermissions()
  const segments = pathname.split('/').filter(Boolean)

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 h-16 af-glass border-b border-[#eceae4] flex items-center gap-3 px-4 sm:px-6 lg:px-8">
      {/* Mobile sidebar toggle */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle navigation"
        className="lg:hidden h-9 w-9 grid place-items-center rounded-xl text-[#57564f] hover:bg-stone-100 transition-colors shrink-0"
      >
        <PanelLeft className="h-[18px] w-[18px]" />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-[13px] min-w-0" aria-label="Breadcrumb">
        <Link href="/dashboard" className="text-[#a8a69b] hover:text-[#57564f] transition-colors hidden sm:inline">
          AssetFlow
        </Link>
        {segments.map((seg, i) => {
          const href = '/' + segments.slice(0, i + 1).join('/')
          const isLast = i === segments.length - 1
          return (
            <span key={href} className="flex items-center gap-1.5 min-w-0">
              <span className="text-[#d3d0c8] hidden sm:inline">/</span>
              {isLast ? (
                <span className="font-medium text-[#1c1b18] truncate">
                  {LABELS[seg] || seg.replace(/-/g, ' ')}
                </span>
              ) : (
                <Link href={href} className="text-[#a8a69b] hover:text-[#57564f] transition-colors capitalize truncate hidden sm:inline">
                  {LABELS[seg] || seg.replace(/-/g, ' ')}
                </Link>
              )}
            </span>
          )
        })}
      </nav>

      <div className="flex-1" />

      {/* Command search (opens palette) */}
      <button
        onClick={openPalette}
        className="group hidden md:flex items-center gap-2.5 h-9 w-64 pl-3 pr-2 bg-white border border-[#e6e4dd] rounded-xl text-[13px] text-[#a8a69b] shadow-xs hover:border-[#d3d0c8] hover:text-[#8c8a80] transition-all"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md bg-stone-100 border border-[#e6e4dd] text-[10.5px] font-semibold text-[#8c8a80] group-hover:bg-stone-50">
          ⌘K
        </kbd>
      </button>

      {/* Mobile search icon */}
      <button
        onClick={openPalette}
        aria-label="Search"
        className="md:hidden h-9 w-9 grid place-items-center rounded-xl bg-white border border-[#e6e4dd] text-[#57564f] shadow-xs hover:border-[#d3d0c8] transition-all"
      >
        <Search className="h-[17px] w-[17px]" />
      </button>

      {/* Quick create — managers register assets, everyone else raises a request */}
      <button
        onClick={() => router.push(isManager ? '/assets/register' : '/maintenance')}
        className="hidden sm:inline-flex items-center gap-1.5 h-9 pl-2.5 pr-3.5 bg-[#1c1b18] hover:bg-[#000] text-white text-[13px] font-medium rounded-xl shadow-xs transition-all active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.4} />
        <span className="hidden lg:inline">{isManager ? 'Create' : 'New Request'}</span>
      </button>

      {/* Notifications */}
      <Link
        href="/notifications"
        aria-label="Notifications"
        className="relative h-9 w-9 flex items-center justify-center rounded-xl bg-white border border-[#e6e4dd] text-[#57564f] hover:text-[#1c1b18] hover:border-[#d3d0c8] shadow-xs transition-all"
      >
        <Bell className="h-[17px] w-[17px]" />
        <span className="af-livedot absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      </Link>

      {/* Profile */}
      <div className="flex items-center gap-2.5 pl-1">
        <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[13px] font-semibold">
          {initials}
        </div>
        <div className="hidden xl:block leading-tight">
          <div className="text-[13px] font-medium text-[#1c1b18]">{user.name}</div>
          <div className="text-[11px] text-[#a8a69b] capitalize">{user.role.replace(/_/g, ' ').toLowerCase()}</div>
        </div>
      </div>
    </header>
  )
}
