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
  ChevronRight,
  Zap,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/assets', label: 'Assets', icon: Package },
  { href: '/allocations', label: 'Allocations', icon: Users },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/audits', label: 'Audits', icon: ClipboardList },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/setup', label: 'Setup', icon: Settings },
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

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500 rounded-lg">
            <Zap className="h-5 w-5 text-slate-900" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-lg leading-tight">AssetFlow</div>
            <div className="text-xs text-slate-400">Enterprise ERP</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300')} />
              {item.label}
              {active && <ChevronRight className="ml-auto h-3 w-3 text-amber-400" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-xl p-3 mb-3">
          <div className="text-sm font-medium text-slate-100 truncate">{user.name}</div>
          <div className="text-xs text-slate-400 truncate">{user.email}</div>
          <div className="mt-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {user.role.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
