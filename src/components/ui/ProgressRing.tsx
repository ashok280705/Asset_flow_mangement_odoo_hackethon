'use client'
import { useEffect, useState } from 'react'

interface ProgressRingProps {
  /** 0–100 */
  value: number
  size?: number
  stroke?: number
  color?: string
  trackColor?: string
  children?: React.ReactNode
  className?: string
}

/**
 * A clean, rounded progress ring. Animates its arc on mount for a premium
 * "drawing in" feel; snaps instantly under prefers-reduced-motion.
 */
export function ProgressRing({
  value,
  size = 132,
  stroke = 11,
  color = '#059669',
  trackColor = '#eceae4',
  children,
  className,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const [progress, setProgress] = useState(0)
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - progress / 100)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setProgress(clamped)
      return
    }
    const id = requestAnimationFrame(() => setProgress(clamped))
    return () => cancelAnimationFrame(id)
  }, [clamped])

  return (
    <div className={className} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.95s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
      )}
    </div>
  )
}
