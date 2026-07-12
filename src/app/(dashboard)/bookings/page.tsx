'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDateTime } from '@/lib/utils'
import { Plus, Calendar } from 'lucide-react'

interface Booking {
  id: string
  startTime: string
  endTime: string
  purpose?: string
  status: string
  asset: { name: string; assetTag: string }
  user: { name: string; email: string }
}

interface Asset { id: string; name: string; assetTag: string }

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [form, setForm] = useState({ assetId: '', startTime: '', endTime: '', purpose: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function fetchData() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const [bookRes, assetRes] = await Promise.all([
      fetch(`/api/bookings?${params}`),
      fetch('/api/assets?isBookable=true&limit=100'),
    ])
    const [bookData, assetData] = await Promise.all([bookRes.json(), assetRes.json()])
    setBookings(bookData.bookings || [])
    setAssets((assetData.assets || []).filter((a: Asset & { isBookable?: boolean }) => a))
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [statusFilter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setShowModal(false)
    setForm({ assetId: '', startTime: '', endTime: '', purpose: '' })
    fetchData()
    setSubmitting(false)
  }

  async function cancelBooking(id: string) {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    })
    fetchData()
  }

  const inputCls = 'w-full bg-white border border-[#e0ded7] text-[#1c1b18] rounded-xl px-3 py-2.5 text-sm placeholder-[#a8a69b] focus:outline-none focus:ring-2 focus:ring-emerald-600/20'
  const labelCls = 'block text-sm font-medium text-[#57564f] mb-1.5'

  return (
    <div className="space-y-6 af-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Resource Bookings</h1>
          <p className="text-[#8c8a80] mt-1">Schedule and manage resource reservations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-xs"
        >
          <Plus className="h-4 w-4" />
          New Booking
        </button>
      </div>

      <div className="flex gap-3">
        {['', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-white border border-[#e6e4dd] text-[#57564f] hover:bg-[#faf9f6]'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[#8c8a80] animate-pulse">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Calendar className="h-12 w-12 text-[#c0bdb2]" />
            <p className="text-[#8c8a80]">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#eceae4]">
                  {['Asset', 'Booked By', 'Start Time', 'End Time', 'Purpose', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#8c8a80] uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee9]">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-[#faf9f6] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1c1b18]">{b.asset.name}</div>
                      <div className="text-xs font-mono text-emerald-700">{b.asset.assetTag}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[#1c1b18]">{b.user.name}</div>
                      <div className="text-xs text-[#8c8a80]">{b.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[#57564f]">{formatDateTime(b.startTime)}</td>
                    <td className="px-4 py-3 text-[#57564f]">{formatDateTime(b.endTime)}</td>
                    <td className="px-4 py-3 text-[#8c8a80]">{b.purpose || '—'}</td>
                    <td className="px-4 py-3"><Badge status={b.status} /></td>
                    <td className="px-4 py-3">
                      {b.status === 'UPCOMING' && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Booking" size="md">
        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Bookable Asset *</label>
            <select value={form.assetId} onChange={e => setForm(p => ({ ...p, assetId: e.target.value }))} required className={inputCls}>
              <option value="">Select asset</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Time *</label>
              <input type="datetime-local" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Time *</label>
              <input type="datetime-local" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} required className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Purpose</label>
            <input value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} placeholder="Reason for booking..." className={inputCls} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#57564f] rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {submitting ? 'Booking...' : 'Book Resource'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
