import { cn } from '@/lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[13px] font-medium text-[#57564f]">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full appearance-none bg-white border border-[#e0ded7] text-[#1c1b18] rounded-xl px-3.5 py-2.5 pr-9 text-sm',
              'shadow-xs transition-all duration-200 cursor-pointer',
              'focus:outline-none focus:ring-[3px] focus:ring-emerald-600/20 focus:border-emerald-500',
              'hover:border-[#d3d0c8]',
              error && 'border-rose-300',
              className
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a8a69b]"
            viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
export { Select }
