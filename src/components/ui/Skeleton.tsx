import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  /** convenience for rounded pill shapes */
  rounded?: boolean
}

/** Shimmering placeholder block. Compose these into skeleton screens. */
export function Skeleton({ className, rounded }: SkeletonProps) {
  return (
    <div
      className={cn('af-skeleton', rounded && 'rounded-full', className)}
      aria-hidden="true"
    />
  )
}

/** A skeleton that mirrors the KPI / stat widget layout. */
export function SkeletonStat() {
  return (
    <div className="af-widget p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-9 w-9 rounded-[12px]" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-28" />
    </div>
  )
}

/** A skeleton that mirrors a larger chart / list widget. */
export function SkeletonWidget({ className }: { className?: string }) {
  return (
    <div className={cn('af-widget p-5 flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

/** Rows of shimmering placeholders for tables. */
export function SkeletonRows({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-[#f0eee9]">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className="h-3.5"
              // first column a touch wider, last a touch shorter for rhythm
              {...{ style: { width: c === 0 ? '18%' : c === cols - 1 ? '10%' : '14%' } }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
