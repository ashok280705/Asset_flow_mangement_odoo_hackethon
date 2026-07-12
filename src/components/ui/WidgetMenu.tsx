'use client'
import { useEffect, useRef, useState } from 'react'
import { MoreVertical, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WidgetMenuItem {
  label: string
  icon?: LucideIcon
  onSelect?: () => void
  danger?: boolean
}

interface WidgetMenuProps {
  items: WidgetMenuItem[]
  label?: string
  className?: string
}

/**
 * The contextual "⋮" menu that lives in the corner of every widget.
 * Closes on outside-click and Escape; fully keyboard reachable.
 */
export function WidgetMenu({ items, label = 'Widget options', className }: WidgetMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'h-7 w-7 grid place-items-center rounded-lg text-[#a8a69b] af-ring',
          'hover:text-[#1c1b18] hover:bg-stone-100 transition-colors',
          open && 'text-[#1c1b18] bg-stone-100'
        )}
      >
        <MoreVertical className="h-4 w-4" strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          className="af-menu af-menu-in absolute right-0 top-9 z-40 min-w-[172px]"
        >
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={i}
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false)
                  item.onSelect?.()
                }}
                className={cn('af-menu-item af-ring', item.danger && 'af-menu-item--danger')}
              >
                {Icon && <Icon className="h-4 w-4 opacity-80" strokeWidth={2} />}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
