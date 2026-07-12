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

  const inputCls = 'w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50'
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Resource Bookings</h1>
          <p className="text-slate-400 mt-1">Schedule and manage resource reservations</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-amber-500/20"
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 animate-pulse">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Calendar className="h-12 w-12 text-slate-600" />
            <p className="text-slate-400">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Asset', 'Booked By', 'Start Time', 'End Time', 'Purpose', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">{b.asset.name}</div>
                      <div className="text-xs font-mono text-amber-400">{b.asset.assetTag}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-100">{b.user.name}</div>
                      <div className="text-xs text-slate-400">{b.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatDateTime(b.startTime)}</td>
                    <td className="px-4 py-3 text-slate-300">{formatDateTime(b.endTime)}</td>
                    <td className="px-4 py-3 text-slate-400">{b.purpose || '—'}</td>
                    <td className="px-4 py-3"><Badge status={b.status} /></td>
                    <td className="px-4 py-3">
                      {b.status === 'UPCOMING' && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="text-xs text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-2.5 py-1 rounded-lg transition-all"
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
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
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
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg disabled:opacity-50">
              {submitting ? 'Booking...' : 'Book Resource'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
