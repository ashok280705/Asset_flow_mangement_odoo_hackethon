'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  LayoutDashboard,
  Package,
  Users,
  Calendar,
  Wrench,
  ClipboardList,
  BarChart3,
  Bell,
  Settings,
  PlusCircle,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Command {
  id: string
  label: string
  hint?: string
  icon: LucideIcon
  group: 'Navigate' | 'Actions'
  keywords?: string
  run: (ctx: { router: ReturnType<typeof useRouter> }) => void | Promise<void>
}

const COMMANDS: Command[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Navigate', keywords: 'home overview', run: ({ router }) => router.push('/dashboard') },
  { id: 'assets', label: 'Assets', icon: Package, group: 'Navigate', keywords: 'directory inventory', run: ({ router }) => router.push('/assets') },
  { id: 'allocations', label: 'Allocations', icon: Users, group: 'Navigate', keywords: 'assign issue', run: ({ router }) => router.push('/allocations') },
  { id: 'bookings', label: 'Bookings', icon: Calendar, group: 'Navigate', keywords: 'reserve schedule', run: ({ router }) => router.push('/bookings') },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, group: 'Navigate', keywords: 'repair service', run: ({ router }) => router.push('/maintenance') },
  { id: 'audits', label: 'Audits', icon: ClipboardList, group: 'Navigate', keywords: 'inspect compliance', run: ({ router }) => router.push('/audits') },
  { id: 'reports', label: 'Reports', icon: BarChart3, group: 'Navigate', keywords: 'analytics insights', run: ({ router }) => router.push('/reports') },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'Navigate', keywords: 'alerts', run: ({ router }) => router.push('/notifications') },
  { id: 'setup', label: 'Organization Setup', icon: Settings, group: 'Navigate', keywords: 'settings config departments categories', run: ({ router }) => router.push('/setup') },
  { id: 'register-asset', label: 'Register a new asset', icon: PlusCircle, group: 'Actions', keywords: 'add create new', run: ({ router }) => router.push('/assets/register') },
  { id: 'view-notifications', label: 'Review notifications', icon: Bell, group: 'Actions', run: ({ router }) => router.push('/notifications') },
  {
    id: 'logout',
    label: 'Sign out',
    icon: LogOut,
    group: 'Actions',
    keywords: 'exit leave',
    run: async ({ router }) => {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    },
  },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActive(0)
  }, [])

  // Global open triggers: Ctrl/Cmd+K, and a custom event (fired by the top-bar search)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    function onCustom() {
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('assetflow:open-command-palette', onCustom)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('assetflow:open-command-palette', onCustom)
    }
  }, [])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 20)
      return () => clearTimeout(t)
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COMMANDS
    return COMMANDS.filter((c) =>
      (c.label + ' ' + (c.keywords ?? '') + ' ' + c.group).toLowerCase().includes(q)
    )
  }, [query])

  useEffect(() => {
    setActive(0)
  }, [query])

  const runAt = useCallback(
    (index: number) => {
      const cmd = results[index]
      if (!cmd) return
      close()
      Promise.resolve(cmd.run({ router }))
    },
    [results, router, close]
  )

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(results.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runAt(active)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  // keep the active item scrolled into view
  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  if (!open) return null

  // group results while preserving order
  const groups: { name: string; items: { cmd: Command; idx: number }[] }[] = []
  results.forEach((cmd, idx) => {
    let g = groups.find((x) => x.name === cmd.group)
    if (!g) {
      g = { name: cmd.group, items: [] }
      groups.push(g)
    }
    g.items.push({ cmd, idx })
  })

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="absolute inset-0 bg-[#1c1b18]/30 backdrop-blur-[3px] af-fade" onClick={close} />

      <div
        className="af-glass relative w-full max-w-[588px] rounded-2xl border border-white/60 shadow-[0_28px_70px_-18px_rgba(28,27,24,0.35)] af-scale-in overflow-hidden"
        onKeyDown={onListKey}
      >
        {/* search field */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[#eceae4]/80">
          <Search className="h-[18px] w-[18px] text-[#a8a69b] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to…"
            className="flex-1 bg-transparent text-[15px] text-[#1c1b18] placeholder-[#a8a69b] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center h-6 px-2 rounded-md bg-white/70 border border-[#e6e4dd] text-[11px] font-medium text-[#8c8a80]">
            Esc
          </kbd>
        </div>

        {/* results */}
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-12 text-center text-[13.5px] text-[#8c8a80]">
              No results for “<span className="text-[#57564f] font-medium">{query}</span>”
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.name} className="mb-1">
                <div className="px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#b0aea3]">
                  {group.name}
                </div>
                {group.items.map(({ cmd, idx }) => {
                  const Icon = cmd.icon
                  const isActive = idx === active
                  return (
                    <button
                      key={cmd.id}
                      data-idx={idx}
                      type="button"
                      onMouseMove={() => setActive(idx)}
                      onClick={() => runAt(idx)}
                      className={cn(
                        'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left transition-colors',
                        isActive ? 'bg-emerald-50/80' : 'hover:bg-stone-100/70'
                      )}
                    >
                      <span
                        className={cn(
                          'grid place-items-center h-8 w-8 rounded-[10px] shrink-0 transition-colors',
                          isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-[#8c8a80]'
                        )}
                      >
                        <Icon className="h-[16px] w-[16px]" strokeWidth={2} />
                      </span>
                      <span className="flex-1 text-[13.5px] font-medium text-[#1c1b18] truncate">
                        {cmd.label}
                      </span>
                      {isActive && (
                        <CornerDownLeft className="h-4 w-4 text-emerald-600/70 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* footer hints */}
        <div className="flex items-center gap-4 px-4 h-11 border-t border-[#eceae4]/80 bg-white/40 text-[11.5px] text-[#8c8a80]">
          <span className="flex items-center gap-1.5">
            <kbd className="grid place-items-center h-5 w-5 rounded bg-white border border-[#e6e4dd]"><ArrowUp className="h-3 w-3" /></kbd>
            <kbd className="grid place-items-center h-5 w-5 rounded bg-white border border-[#e6e4dd]"><ArrowDown className="h-3 w-3" /></kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="grid place-items-center h-5 px-1 rounded bg-white border border-[#e6e4dd]"><CornerDownLeft className="h-3 w-3" /></kbd>
            to select
          </span>
        </div>
      </div>
    </div>
  )
}
