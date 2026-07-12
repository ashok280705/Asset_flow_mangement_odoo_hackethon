'use client'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#1c1b18]/25 backdrop-blur-[2px] af-fade"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full bg-white border border-[#e9e7e1] rounded-2xl shadow-lift af-scale-in',
          sizes[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#efede8]">
            <h2 className="text-[17px] font-semibold text-[#1c1b18]">{title}</h2>
            <button
              onClick={onClose}
              className="text-[#8c8a80] hover:text-[#1c1b18] transition-colors p-1.5 rounded-lg hover:bg-stone-100"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
