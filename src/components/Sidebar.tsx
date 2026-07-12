'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
} from 'lucide-react'

const navGroups: { label: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/reports', label: 'Reports', icon: BarChart3 },
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
      { href: '/setup', label: 'Setup', icon: Settings },
    ],
  },
]

interface SidebarProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

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

  return (
    <aside className="w-[248px] shrink-0 h-screen sticky top-0 bg-white border-r border-[#eceae4] flex flex-col">
      {/* Brand */}
      <div className="px-5 h-16 flex items-center gap-2.5 border-b border-[#f0eee9]">
        <div className="h-8 w-8 rounded-[10px] bg-emerald-600 flex items-center justify-center shadow-xs">
          <Boxes className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-semibold text-[15px] text-[#1c1b18] leading-tight tracking-tight">AssetFlow</div>
          <div className="text-[11px] text-[#a8a69b] leading-tight">Enterprise ERP</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#b0aea3]">
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
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13.5px] font-medium transition-all duration-150',
                      active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-[#57564f] hover:bg-stone-100 hover:text-[#1c1b18]'
                    )}
                  >
                    <Icon
                      className={cn('h-[17px] w-[17px]', active ? 'text-emerald-600' : 'text-[#9a988e] group-hover:text-[#57564f]')}
                      strokeWidth={2}
                    />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[#f0eee9]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[13px] font-semibold shrink-0">
            {initials}
          </div>
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
        </div>
      </div>
    </aside>
  )
}
