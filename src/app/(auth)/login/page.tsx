'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Boxes, Users, Wrench, CalendarCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full bg-white border border-[#e0ded7] text-[#1c1b18] placeholder-[#a8a69b] rounded-xl px-3.5 py-2.5 text-sm shadow-xs focus:outline-none focus:ring-[3px] focus:ring-emerald-600/20 focus:border-emerald-500 hover:border-[#d3d0c8] transition-all'

  return (
    <div className="af-fade-in">
      {/* What AssetFlow is — visible on mobile where the brand panel is hidden */}
      <div className="lg:hidden mb-6 p-4 rounded-2xl bg-[#faf9f6] border border-[#eceae4]">
        <div className="flex items-center gap-2 mb-1.5">
          <Boxes className="h-4 w-4 text-emerald-600" strokeWidth={2.2} />
          <span className="text-[13px] font-semibold text-[#1c1b18]">What is AssetFlow?</span>
        </div>
        <p className="text-[12.5px] text-[#57564f] leading-relaxed">
          A centralized system to register assets, allocate them to people, book shared
          resources, run maintenance approvals, and audit everything — in one place.
        </p>
      </div>

      <div className="mb-7">
        <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Welcome back</h1>
        <p className="text-[#8c8a80] mt-1.5 text-[14px]">Sign in to your AssetFlow workspace</p>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[13px]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-[#57564f] mb-1.5">Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            className={inputCls}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[13px] font-medium text-[#57564f]">Password</label>
            <button
              type="button"
              onClick={() => setShowForgot(v => !v)}
              className="text-[12px] text-emerald-700 hover:text-emerald-800 font-medium"
            >
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className={inputCls}
          />
          {showForgot && (
            <p className="mt-2 text-[12px] text-[#8c8a80] bg-[#faf9f6] border border-[#eceae4] rounded-lg px-3 py-2">
              Password resets are handled by your administrator. Contact your AssetFlow admin
              to have your password reset — self-service reset can be enabled via email later.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-medium rounded-xl py-2.5 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs mt-1"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-[#8c8a80] text-[13.5px]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-emerald-700 hover:text-emerald-800 font-medium">
            Create one
          </Link>
          <span className="text-[#c9c6bd]"> — new sign-ups join as employees.</span>
        </p>
      </div>

      {/* How to use — sign in as a role to explore */}
      <div className="mt-7 p-4 rounded-2xl border border-[#eceae4] bg-white">
        <p className="text-[11px] text-[#a8a69b] font-semibold uppercase tracking-wide mb-3">
          Try it — sign in as a role
        </p>
        <div className="space-y-2.5">
          {[
            { role: 'Admin', cred: 'admin@assetflow.com · Admin@123', desc: 'Sets up departments, categories & assigns roles', icon: Boxes, tone: 'text-violet-600 bg-violet-50' },
            { role: 'Asset Manager', cred: 'manager@assetflow.com · Manager@123', desc: 'Registers, allocates & approves transfers/maintenance', icon: Wrench, tone: 'text-amber-600 bg-amber-50' },
            { role: 'Department Head', cred: 'head@assetflow.com · Head@123', desc: 'Oversees their department’s assets & bookings', icon: Users, tone: 'text-teal-600 bg-teal-50' },
            { role: 'Employee', cred: 'emp1@assetflow.com · Employee@123', desc: 'Sees own assets, books resources, raises requests', icon: CalendarCheck, tone: 'text-emerald-600 bg-emerald-50' },
          ].map(({ role, cred, desc, icon: Icon, tone }) => (
            <button
              key={role}
              type="button"
              onClick={() => { const [e, p] = cred.split(' · '); setEmail(e); setPassword(p) }}
              className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#faf9f6] transition-colors group"
            >
              <span className={`grid place-items-center h-8 w-8 rounded-[10px] shrink-0 ${tone}`}>
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="text-[12.5px] font-semibold text-[#1c1b18]">{role}</span>
                <span className="block text-[11.5px] text-[#8c8a80] leading-snug">{desc}</span>
                <span className="block text-[11px] font-mono text-[#a8a69b] mt-0.5 group-hover:text-emerald-700 transition-colors">{cred}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[#a8a69b] mt-3 pt-3 border-t border-[#f0eee9]">
          Tap a role to auto-fill its credentials, then press Sign in.
        </p>
      </div>
    </div>
  )
}
