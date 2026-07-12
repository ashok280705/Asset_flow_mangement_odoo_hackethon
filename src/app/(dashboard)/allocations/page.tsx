'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Plus, RotateCcw } from 'lucide-react'

interface Allocation {
  id: string
  status: string
  allocatedAt: string
  expectedReturn?: string
  returnedAt?: string
  conditionOut: string
  conditionIn?: string
  returnNotes?: string
  asset: { id: string; name: string; assetTag: string; category: { name: string } }
  user: { name: string; email: string; department?: { name: string } }
}

interface Asset { id: string; name: string; assetTag: string }
interface Employee { id: string; name: string; email: string }

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [returnModal, setReturnModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' })
  const [assets, setAssets] = useState<Asset[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [form, setForm] = useState({ assetId: '', userId: '', expectedReturn: '', conditionOut: 'GOOD' })
  const [returnForm, setReturnForm] = useState({ conditionIn: 'GOOD', returnNotes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function fetchData() {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const [allRes, assetRes, empRes] = await Promise.all([
      fetch(`/api/allocations?${params}`),
      fetch('/api/assets?status=AVAILABLE&limit=100'),
      fetch('/api/employees'),
    ])
    const [allData, assetData, empData] = await Promise.all([allRes.json(), assetRes.json(), empRes.json()])
    setAllocations(allData.allocations || [])
    setAssets(assetData.assets || [])
    setEmployees(empData.employees || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [statusFilter])

  async function handleAllocate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setShowModal(false)
    setForm({ assetId: '', userId: '', expectedReturn: '', conditionOut: 'GOOD' })
    fetchData()
    setSubmitting(false)
  }

  async function handleReturn(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch(`/api/allocations/${returnModal.id}/return`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(returnForm),
    })
    if (res.ok) { setReturnModal({ open: false, id: '' }); fetchData() }
    setSubmitting(false)
  }

  const inputCls = 'w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50'
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Allocations</h1>
          <p className="text-slate-400 mt-1">Track asset assignments to employees</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          New Allocation
        </button>
      </div>

      <div className="flex gap-3">
        {['', 'ACTIVE', 'RETURNED', 'OVERDUE'].map(s => (
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Asset', 'Assigned To', 'Department', 'Allocated On', 'Expected Return', 'Condition', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {allocations.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-slate-400 py-12">No allocations found</td></tr>
                ) : allocations.map(a => (
                  <tr key={a.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">{a.asset.name}</div>
                      <div className="text-xs font-mono text-amber-400">{a.asset.assetTag}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-100">{a.user.name}</div>
                      <div className="text-xs text-slate-400">{a.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{a.user.department?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(a.allocatedAt)}</td>
                    <td className="px-4 py-3 text-slate-400">{a.expectedReturn ? formatDate(a.expectedReturn) : '—'}</td>
                    <td className="px-4 py-3"><Badge status={a.conditionOut} /></td>
                    <td className="px-4 py-3"><Badge status={a.status} /></td>
                    <td className="px-4 py-3">
                      {a.status === 'ACTIVE' && (
                        <button
                          onClick={() => setReturnModal({ open: true, id: a.id })}
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 px-2.5 py-1 rounded-lg transition-all"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Return
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Allocation" size="md">
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
        <form onSubmit={handleAllocate} className="space-y-4">
          <div>
            <label className={labelCls}>Asset *</label>
            <select value={form.assetId} onChange={e => setForm(p => ({ ...p, assetId: e.target.value }))} required className={inputCls}>
              <option value="">Select available asset</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Employee *</label>
            <select value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} required className={inputCls}>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} - {e.email}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Expected Return Date</label>
            <input type="date" value={form.expectedReturn} onChange={e => setForm(p => ({ ...p, expectedReturn: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Condition at Handout</label>
            <select value={form.conditionOut} onChange={e => setForm(p => ({ ...p, conditionOut: e.target.value }))} className={inputCls}>
              {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg disabled:opacity-50 transition-all">
              {submitting ? 'Allocating...' : 'Allocate Asset'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={returnModal.open} onClose={() => setReturnModal({ open: false, id: '' })} title="Return Asset" size="sm">
        <form onSubmit={handleReturn} className="space-y-4">
          <div>
            <label className={labelCls}>Condition on Return</label>
            <select value={returnForm.conditionIn} onChange={e => setReturnForm(p => ({ ...p, conditionIn: e.target.value }))} className={inputCls}>
              {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Return Notes</label>
            <textarea value={returnForm.returnNotes} onChange={e => setReturnForm(p => ({ ...p, returnNotes: e.target.value }))} rows={3} className={inputCls + ' resize-none'} placeholder="Any observations..." />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setReturnModal({ open: false, id: '' })} className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-lg disabled:opacity-50">
              {submitting ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
