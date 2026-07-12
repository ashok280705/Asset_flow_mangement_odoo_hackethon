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

  const inputCls = 'w-full bg-white border border-[#e0ded7] text-[#1c1b18] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500'
  const labelCls = 'block text-sm font-medium text-[#57564f] mb-1.5'

  return (
    <div className="space-y-6 af-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Allocations</h1>
          <p className="text-[#8c8a80] text-[14px] mt-1">Track asset assignments to employees</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-xs"
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
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-[#8c8a80] hover:text-[#1c1b18] hover:bg-[#faf9f6]'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[#8c8a80] animate-pulse">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#faf9f6] border-b border-[#eceae4]">
                  {['Asset', 'Assigned To', 'Department', 'Allocated On', 'Expected Return', 'Condition', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-[#8c8a80] uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee9]">
                {allocations.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-[#8c8a80] py-12">No allocations found</td></tr>
                ) : allocations.map(a => (
                  <tr key={a.id} className="hover:bg-[#faf9f6] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1c1b18]">{a.asset.name}</div>
                      <div className="text-xs font-mono text-emerald-700">{a.asset.assetTag}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[#1c1b18]">{a.user.name}</div>
                      <div className="text-xs text-[#8c8a80]">{a.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-[#57564f]">{a.user.department?.name || '—'}</td>
                    <td className="px-4 py-3 text-[#8c8a80]">{formatDate(a.allocatedAt)}</td>
                    <td className="px-4 py-3 text-[#8c8a80]">{a.expectedReturn ? formatDate(a.expectedReturn) : '—'}</td>
                    <td className="px-4 py-3"><Badge status={a.conditionOut} /></td>
                    <td className="px-4 py-3"><Badge status={a.status} /></td>
                    <td className="px-4 py-3">
                      {a.status === 'ACTIVE' && (
                        <button
                          onClick={() => setReturnModal({ open: true, id: a.id })}
                          className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-all"
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
        {error && <div className="mb-4 p-3 bg-rose-50 border border-[#eceae4] rounded-xl text-rose-700 text-sm">{error}</div>}
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
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-all">
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
            <button type="button" onClick={() => setReturnModal({ open: false, id: '' })} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {submitting ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
