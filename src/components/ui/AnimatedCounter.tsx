'use client'
import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  /** total animation duration in ms */
  duration?: number
  /** number of decimals to render */
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

/**
 * Smoothly counts up to `value` on mount and whenever `value` changes.
 * Respects prefers-reduced-motion (snaps instantly) and uses tabular
 * figures so the surrounding layout never jitters mid-animation.
 */
export function AnimatedCounter({
  value,
  duration = 900,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || duration <= 0) {
      setDisplay(value)
      fromRef.current = value
      return
    }

    const from = fromRef.current
    const delta = value - from
    if (delta === 0) {
      setDisplay(value)
      return
    }

    startRef.current = null
    // easeOutExpo — fast, decisive, settles softly (premium feel)
    const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const t = Math.min(1, elapsed / duration)
      const next = from + delta * ease(t)
      setDisplay(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  const formatted = display.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className={className}>
      <span className="af-num">{prefix}{formatted}{suffix}</span>
    </span>
  )
}
