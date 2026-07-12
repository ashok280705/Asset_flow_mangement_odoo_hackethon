'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { usePermissions } from '@/components/SessionProvider'
import { Plus, Wrench } from 'lucide-react'

interface MaintenanceRequest {
  id: string
  description: string
  priority: string
  status: string
  createdAt: string
  resolvedAt?: string
  notes?: string
  asset: { name: string; assetTag: string }
  raisedBy: { name: string; email: string }
}

interface Asset { id: string; name: string; assetTag: string }

export default function MaintenancePage() {
  const { isManager } = usePermissions()
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [updateModal, setUpdateModal] = useState<{ open: boolean; id: string; currentStatus: string }>({ open: false, id: '', currentStatus: '' })
  const [assets, setAssets] = useState<Asset[]>([])
  const [form, setForm] = useState({ assetId: '', description: '', priority: 'MEDIUM' })
  const [updateForm, setUpdateForm] = useState({ status: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function fetchData() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const [reqRes, assetRes] = await Promise.all([
      fetch(`/api/maintenance?${params}`),
      fetch('/api/assets?limit=100'),
    ])
    const [reqData, assetData] = await Promise.all([reqRes.json(), assetRes.json()])
    setRequests(reqData.requests || [])
    setAssets(assetData.assets || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [statusFilter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setShowModal(false)
    setForm({ assetId: '', description: '', priority: 'MEDIUM' })
    fetchData()
    setSubmitting(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch(`/api/maintenance/${updateModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateForm),
    })
    setUpdateModal({ open: false, id: '', currentStatus: '' })
    fetchData()
    setSubmitting(false)
  }

  const priorityColors: Record<string, string> = {
    LOW: 'text-stone-600 bg-stone-100',
    MEDIUM: 'text-amber-700 bg-amber-50',
    HIGH: 'text-orange-700 bg-orange-50',
    CRITICAL: 'text-rose-700 bg-rose-50',
  }

  const inputCls = 'w-full bg-white border border-[#e0ded7] text-[#1c1b18] rounded-xl px-3 py-2.5 text-sm placeholder-[#a8a69b] focus:outline-none focus:ring-2 focus:ring-emerald-600/20'
  const labelCls = 'block text-sm font-medium text-[#57564f] mb-1.5'

  const nextStatuses: Record<string, string[]> = {
    PENDING: ['APPROVED', 'REJECTED'],
    APPROVED: ['TECHNICIAN_ASSIGNED', 'IN_PROGRESS'],
    TECHNICIAN_ASSIGNED: ['IN_PROGRESS'],
    IN_PROGRESS: ['RESOLVED'],
  }

  return (
    <div className="space-y-6 af-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Maintenance Requests</h1>
          <p className="text-[#8c8a80] mt-1">Track and manage asset repair workflows</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Raise Request
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        {['', 'PENDING', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map(s => (
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
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Wrench className="h-12 w-12 text-[#c0bdb2]" />
            <p className="text-[#8c8a80]">No maintenance requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#eceae4]">
                  {['Asset', 'Description', 'Priority', 'Raised By', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#8c8a80] uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee9]">
                {requests.map(r => (
                  <tr key={r.id} className="hover:bg-[#faf9f6] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1c1b18]">{r.asset.name}</div>
                      <div className="text-xs font-mono text-emerald-700">{r.asset.assetTag}</div>
                    </td>
                    <td className="px-4 py-3 text-[#57564f] max-w-[200px] truncate">{r.description}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[r.priority]}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#57564f]">{r.raisedBy.name}</td>
                    <td className="px-4 py-3 text-[#8c8a80]">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3"><Badge status={r.status} /></td>
                    <td className="px-4 py-3">
                      {isManager && nextStatuses[r.status] ? (
                        <button
                          onClick={() => { setUpdateModal({ open: true, id: r.id, currentStatus: r.status }); setUpdateForm({ status: nextStatuses[r.status][0], notes: '' }) }}
                          className="text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all"
                        >
                          Update
                        </button>
                      ) : (
                        <span className="text-xs text-[#a8a69b]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Raise Maintenance Request" size="md">
        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Asset *</label>
            <select value={form.assetId} onChange={e => setForm(p => ({ ...p, assetId: e.target.value }))} required className={inputCls}>
              <option value="">Select asset</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Description *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required rows={3} placeholder="Describe the issue..." className={inputCls + ' resize-none'} />
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className={inputCls}>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#57564f] rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={updateModal.open} onClose={() => setUpdateModal({ open: false, id: '', currentStatus: '' })} title="Update Status" size="sm">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className={labelCls}>New Status</label>
            <select value={updateForm.status} onChange={e => setUpdateForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
              {(nextStatuses[updateModal.currentStatus] || []).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={updateForm.notes} onChange={e => setUpdateForm(p => ({ ...p, notes: e.target.value }))} rows={3} className={inputCls + ' resize-none'} placeholder="Update notes..." />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setUpdateModal({ open: false, id: '', currentStatus: '' })} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#57564f] rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {submitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
