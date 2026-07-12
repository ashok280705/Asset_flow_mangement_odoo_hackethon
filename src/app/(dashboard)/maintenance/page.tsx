'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
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
    LOW: 'text-slate-400 bg-slate-400/10',
    MEDIUM: 'text-amber-400 bg-amber-400/10',
    HIGH: 'text-orange-400 bg-orange-400/10',
    CRITICAL: 'text-red-400 bg-red-400/10',
  }

  const inputCls = 'w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50'
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5'

  const nextStatuses: Record<string, string[]> = {
    PENDING: ['APPROVED', 'REJECTED'],
    APPROVED: ['TECHNICIAN_ASSIGNED', 'IN_PROGRESS'],
    TECHNICIAN_ASSIGNED: ['IN_PROGRESS'],
    IN_PROGRESS: ['RESOLVED'],
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Maintenance Requests</h1>
          <p className="text-slate-400 mt-1">Track and manage asset repair workflows</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-amber-500/20"
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400 animate-pulse">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Wrench className="h-12 w-12 text-slate-600" />
            <p className="text-slate-400">No maintenance requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Asset', 'Description', 'Priority', 'Raised By', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {requests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">{r.asset.name}</div>
                      <div className="text-xs font-mono text-amber-400">{r.asset.assetTag}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">{r.description}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[r.priority]}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{r.raisedBy.name}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3"><Badge status={r.status} /></td>
                    <td className="px-4 py-3">
                      {nextStatuses[r.status] && (
                        <button
                          onClick={() => { setUpdateModal({ open: true, id: r.id, currentStatus: r.status }); setUpdateForm({ status: nextStatuses[r.status][0], notes: '' }) }}
                          className="text-xs text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-lg transition-all"
                        >
                          Update
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Raise Maintenance Request" size="md">
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
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
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg disabled:opacity-50">
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
            <button type="button" onClick={() => setUpdateModal({ open: false, id: '', currentStatus: '' })} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg disabled:opacity-50">
              {submitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
