import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[13px] font-medium text-[#57564f]">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a69b]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-white border border-[#e0ded7] text-[#1c1b18] placeholder-[#a8a69b] rounded-xl px-3.5 py-2.5 text-sm',
              'shadow-xs transition-all duration-200',
              'focus:outline-none focus:ring-[3px] focus:ring-emerald-600/20 focus:border-emerald-500',
              'hover:border-[#d3d0c8]',
              icon && 'pl-10',
              error && 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-400',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export { Input }
