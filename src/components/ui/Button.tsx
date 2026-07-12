import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary:
        'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium shadow-xs',
      secondary:
        'bg-white hover:bg-stone-50 active:bg-stone-100 text-[#1c1b18] font-medium border border-[#e0ded7] shadow-xs',
      danger:
        'bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-600 font-medium border border-rose-200',
      ghost:
        'text-[#57564f] hover:bg-stone-100 hover:text-[#1c1b18] font-medium',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-[10px]',
      md: 'px-4 py-2.5 text-sm rounded-xl',
      lg: 'px-5 py-3 text-[15px] rounded-xl',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-600/25',
          'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export { Button }
