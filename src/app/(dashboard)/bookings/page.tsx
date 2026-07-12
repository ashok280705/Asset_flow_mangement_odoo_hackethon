'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/lib/utils'
import { Plus, Calendar, List, CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

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

const DOT: Record<string, string> = {
  UPCOMING: 'bg-teal-500', ONGOING: 'bg-emerald-500', COMPLETED: 'bg-stone-400', CANCELLED: 'bg-rose-400',
}

function startOfWeek(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - x.getDay()) // back to Sunday
  return x
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }
function sameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }
function hhmm(iso: string) { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [form, setForm] = useState({ assetId: '', startTime: '', endTime: '', purpose: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView] = useState<'list' | 'calendar'>('calendar')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [reschedule, setReschedule] = useState<{ open: boolean; id: string; startTime: string; endTime: string }>({ open: false, id: '', startTime: '', endTime: '' })
  const [rescheduleErr, setRescheduleErr] = useState('')

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
    setAssets(assetData.assets || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [statusFilter])
  // Fire poll-based reminders for imminent bookings on load.
  useEffect(() => { fetch('/api/bookings/reminders', { method: 'POST' }).catch(() => {}) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setError('')
    const res = await fetch('/api/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setShowModal(false)
    setForm({ assetId: '', startTime: '', endTime: '', purpose: '' })
    fetchData(); setSubmitting(false)
  }

  async function cancelBooking(id: string) {
    await fetch(`/api/bookings/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'CANCELLED' }),
    })
    fetchData()
  }

  async function saveReschedule(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setRescheduleErr('')
    const res = await fetch(`/api/bookings/${reschedule.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime: reschedule.startTime, endTime: reschedule.endTime }),
    })
    const data = await res.json()
    if (!res.ok) { setRescheduleErr(data.error); setSubmitting(false); return }
    setReschedule({ open: false, id: '', startTime: '', endTime: '' })
    fetchData(); setSubmitting(false)
  }

  function openReschedule(b: Booking) {
    // datetime-local wants "YYYY-MM-DDTHH:mm" in local time
    const toLocal = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }
    setRescheduleErr('')
    setReschedule({ open: true, id: b.id, startTime: toLocal(b.startTime), endTime: toLocal(b.endTime) })
  }

  const inputCls = 'w-full bg-white border border-[#e0ded7] text-[#1c1b18] rounded-xl px-3 py-2.5 text-sm placeholder-[#a8a69b] focus:outline-none focus:ring-2 focus:ring-emerald-600/20'
  const labelCls = 'block text-sm font-medium text-[#57564f] mb-1.5'

  const now = new Date()
  const soonMs = 60 * 60 * 1000
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekLabel = `${weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${addDays(weekStart, 6).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`

  return (
    <div className="space-y-6 af-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Resource Bookings</h1>
          <p className="text-[#8c8a80] mt-1">Schedule and manage resource reservations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-white border border-[#e6e4dd] rounded-xl p-1">
            <button onClick={() => setView('calendar')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${view === 'calendar' ? 'bg-emerald-50 text-emerald-700' : 'text-[#8c8a80] hover:text-[#1c1b18]'}`}>
              <CalendarDays className="h-4 w-4" /> Calendar
            </button>
            <button onClick={() => setView('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${view === 'list' ? 'bg-emerald-50 text-emerald-700' : 'text-[#8c8a80] hover:text-[#1c1b18]'}`}>
              <List className="h-4 w-4" /> List
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" /> New Booking
          </button>
        </div>
      </div>

      {view === 'list' && (
        <div className="flex gap-3 flex-wrap">
          {['', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-white border border-[#e6e4dd] text-[#57564f] hover:bg-[#faf9f6]'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === 'calendar' && (
        <div className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#efede8]">
            <div className="text-[14px] font-semibold text-[#1c1b18]">{weekLabel}</div>
            <div className="flex items-center gap-1">
              <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="h-8 w-8 grid place-items-center rounded-lg text-[#57564f] hover:bg-stone-100 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setWeekStart(startOfWeek(new Date()))} className="px-3 h-8 rounded-lg text-[12.5px] font-medium text-[#57564f] hover:bg-stone-100 transition-colors">Today</button>
              <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="h-8 w-8 grid place-items-center rounded-lg text-[#57564f] hover:bg-stone-100 transition-colors"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          {loading ? (
            <div className="h-64 grid place-items-center text-[#8c8a80] animate-pulse">Loading…</div>
          ) : (
            <div className="grid grid-cols-7 divide-x divide-[#f0eee9] min-h-[340px]">
              {days.map((day) => {
                const dayBookings = bookings
                  .filter(b => sameDay(new Date(b.startTime), day) && b.status !== 'CANCELLED')
                  .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
                const isToday = sameDay(day, now)
                return (
                  <div key={day.toISOString()} className="min-w-0">
                    <div className={`px-2 py-2 text-center border-b border-[#f0eee9] ${isToday ? 'bg-emerald-50/50' : ''}`}>
                      <div className="text-[10px] uppercase tracking-wide text-[#a8a69b]">{day.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                      <div className={`text-[15px] font-semibold ${isToday ? 'text-emerald-700' : 'text-[#1c1b18]'}`}>{day.getDate()}</div>
                    </div>
                    <div className="p-1.5 space-y-1.5">
                      {dayBookings.length === 0 ? (
                        <div className="text-[11px] text-[#c9c6bd] text-center py-3">—</div>
                      ) : dayBookings.map(b => {
                        const soon = b.status === 'UPCOMING' && +new Date(b.startTime) - +now < soonMs && +new Date(b.startTime) > +now
                        return (
                          <div key={b.id} className={`rounded-lg p-2 border text-left ${soon ? 'border-amber-300 bg-amber-50' : 'border-[#eceae4] bg-[#faf9f6]'}`}>
                            <div className="flex items-center gap-1 text-[11px] font-medium text-[#57564f]">
                              <span className={`h-1.5 w-1.5 rounded-full ${DOT[b.status]}`} />
                              {hhmm(b.startTime)}–{hhmm(b.endTime)}
                            </div>
                            <div className="text-[12px] font-medium text-[#1c1b18] truncate mt-0.5">{b.asset.name}</div>
                            <div className="text-[10px] font-mono text-emerald-700 truncate">{b.asset.assetTag}</div>
                            {soon && <div className="text-[10px] text-amber-700 font-medium mt-0.5 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> Starting soon</div>}
                            {b.status === 'UPCOMING' && (
                              <div className="flex gap-1 mt-1.5">
                                <button onClick={() => openReschedule(b)} className="text-[10px] text-emerald-700 bg-emerald-100/60 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors">Move</button>
                                <button onClick={() => cancelBooking(b.id)} className="text-[10px] text-rose-600 bg-rose-100/60 hover:bg-rose-100 px-1.5 py-0.5 rounded transition-colors">Cancel</button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-[#8c8a80] animate-pulse">Loading...</div>
          ) : bookings.length === 0 ? (
            <EmptyState icon={Calendar} title="No bookings found" description="Book a shared resource to see it here." compact />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#eceae4] bg-[#faf9f6]">
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
                          <div className="flex gap-2">
                            <button onClick={() => openReschedule(b)} className="text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all">Reschedule</button>
                            <button onClick={() => cancelBooking(b.id)} className="text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-all">Cancel</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* New booking */}
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

      {/* Reschedule */}
      <Modal open={reschedule.open} onClose={() => setReschedule(p => ({ ...p, open: false }))} title="Reschedule Booking" size="sm">
        {rescheduleErr && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">{rescheduleErr}</div>}
        <form onSubmit={saveReschedule} className="space-y-4">
          <div>
            <label className={labelCls}>New Start Time *</label>
            <input type="datetime-local" value={reschedule.startTime} onChange={e => setReschedule(p => ({ ...p, startTime: e.target.value }))} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>New End Time *</label>
            <input type="datetime-local" value={reschedule.endTime} onChange={e => setReschedule(p => ({ ...p, endTime: e.target.value }))} required className={inputCls} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setReschedule(p => ({ ...p, open: false }))} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#57564f] rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {submitting ? 'Saving...' : 'Reschedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
