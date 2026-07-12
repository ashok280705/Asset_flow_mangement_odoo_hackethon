'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Signup failed')
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
      <div className="mb-7">
        <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Create account</h1>
        <p className="text-[#8c8a80] mt-1.5 text-[14px]">Join AssetFlow as an Employee</p>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[13px]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-[#57564f] mb-1.5">Full name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Jane Cooper"
            className={inputCls}
          />
        </div>
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
          <label className="block text-[13px] font-medium text-[#57564f] mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Min. 6 characters"
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-medium rounded-xl py-2.5 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs mt-1"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-[#8c8a80] text-[13.5px]">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-700 hover:text-emerald-800 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
