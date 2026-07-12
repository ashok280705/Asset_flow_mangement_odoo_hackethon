'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Users,
  Calendar,
  Wrench,
  ClipboardList,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Boxes,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  type LucideIcon,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: LucideIcon; roles?: string[] }

// `roles` (when present) restricts an item to those roles. Absent = everyone.
const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/setup', label: 'Setup', icon: Settings, roles: ['ADMIN'] },
      { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/assets', label: 'Assets', icon: Package },
      { href: '/allocations', label: 'Allocations', icon: Users },
      { href: '/bookings', label: 'Bookings', icon: Calendar },
      { href: '/maintenance', label: 'Maintenance', icon: Wrench },
      { href: '/audits', label: 'Audits', icon: ClipboardList },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/notifications', label: 'Notifications', icon: Bell },
    ],
  },
]

interface SidebarProps {
  user: { name: string; email: string; role: string }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // restore collapsed preference
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('af:sidebar-collapsed') === '1')
    } catch {}
  }, [])

  // mobile drawer toggle (fired by the top bar) + close on route change
  useEffect(() => {
    function onToggle() {
      setMobileOpen((v) => !v)
    }
    window.addEventListener('assetflow:toggle-sidebar', onToggle)
    return () => window.removeEventListener('assetflow:toggle-sidebar', onToggle)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v
      try {
        localStorage.setItem('af:sidebar-collapsed', next ? '1' : '0')
      } catch {}
      return next
    })
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  function NavList({ compact }: { compact: boolean }) {
    const groups = navGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(user.role)) }))
      .filter((g) => g.items.length > 0)
    return (
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <div
              className={cn(
                'px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#b0aea3] transition-opacity',
                compact && 'opacity-0 h-0 mb-0 overflow-hidden'
              )}
            >
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={compact ? item.label : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13.5px] font-medium transition-all duration-150',
                      compact && 'justify-center px-0',
                      active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-[#57564f] hover:bg-stone-100 hover:text-[#1c1b18]'
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-emerald-600" />
                    )}
                    <Icon
                      className={cn(
                        'h-[17px] w-[17px] shrink-0 transition-colors',
                        active ? 'text-emerald-600' : 'text-[#9a988e] group-hover:text-[#57564f]'
                      )}
                      strokeWidth={2}
                    />
                    {!compact && item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    )
  }

  function Brand({ compact }: { compact: boolean }) {
    return (
      <div className={cn('h-16 flex items-center border-b border-[#f0eee9]', compact ? 'justify-center px-0' : 'px-5 gap-2.5')}>
        <div className="h-8 w-8 rounded-[10px] bg-emerald-600 flex items-center justify-center shadow-xs shrink-0">
          <Boxes className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
        </div>
        {!compact && (
          <div className="min-w-0">
            <div className="font-semibold text-[15px] text-[#1c1b18] leading-tight tracking-tight">AssetFlow</div>
            <div className="text-[11px] text-[#a8a69b] leading-tight">Enterprise ERP</div>
          </div>
        )}
      </div>
    )
  }

  function UserBlock({ compact }: { compact: boolean }) {
    return (
      <div className="p-3 border-t border-[#f0eee9]">
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-xl', compact && 'justify-center px-0')}>
          <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[13px] font-semibold shrink-0">
            {initials}
          </div>
          {!compact && (
            <>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-[#1c1b18] truncate">{user.name}</div>
                <div className="text-[11px] text-[#a8a69b] truncate capitalize">
                  {user.role.replace(/_/g, ' ').toLowerCase()}
                </div>
              </div>
              <button
                onClick={handleLogout}
                aria-label="Sign out"
                className="p-2 rounded-lg text-[#9a988e] hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              >
                <LogOut className="h-[16px] w-[16px]" />
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex shrink-0 h-screen sticky top-0 bg-white border-r border-[#eceae4] flex-col transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          collapsed ? 'w-[76px]' : 'w-[248px]'
        )}
      >
        <Brand compact={collapsed} />
        <NavList compact={collapsed} />
        {/* collapse control */}
        <div className="px-3 pb-1">
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] font-medium text-[#8c8a80] hover:bg-stone-100 hover:text-[#57564f] transition-colors',
              collapsed && 'justify-center px-0'
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-[17px] w-[17px]" /> : <PanelLeftClose className="h-[17px] w-[17px]" />}
            {!collapsed && 'Collapse'}
          </button>
        </div>
        <UserBlock compact={collapsed} />
      </aside>

      {/* Mobile drawer */}
      <div className={cn('lg:hidden fixed inset-0 z-50', mobileOpen ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div
          className={cn(
            'absolute inset-0 bg-[#1c1b18]/30 backdrop-blur-[2px] transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            'absolute left-0 top-0 h-full w-[268px] bg-white border-r border-[#eceae4] flex flex-col shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#f0eee9]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-[10px] bg-emerald-600 flex items-center justify-center shadow-xs">
                <Boxes className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
              </div>
              <div>
                <div className="font-semibold text-[15px] text-[#1c1b18] leading-tight tracking-tight">AssetFlow</div>
                <div className="text-[11px] text-[#a8a69b] leading-tight">Enterprise ERP</div>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="p-2 rounded-lg text-[#8c8a80] hover:bg-stone-100 transition-colors"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
          <NavList compact={false} />
          <UserBlock compact={false} />
        </aside>
      </div>
    </>
  )
}
