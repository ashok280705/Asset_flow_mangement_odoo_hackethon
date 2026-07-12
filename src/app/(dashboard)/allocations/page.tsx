'use client'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { usePermissions } from '@/components/SessionProvider'
import { formatDate } from '@/lib/utils'
import { Plus, RotateCcw, ArrowLeftRight, Check, X, Users } from 'lucide-react'

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
interface Transfer {
  id: string
  reason?: string
  status: string
  createdAt: string
  asset: { name: string; assetTag: string }
  requester: { name: string; email: string }
}

export default function AllocationsPage() {
  const { isApprover } = usePermissions()
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [returnModal, setReturnModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' })
  const [assets, setAssets] = useState<Asset[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [form, setForm] = useState({ assetId: '', userId: '', expectedReturn: '', conditionOut: 'GOOD' })
  const [returnForm, setReturnForm] = useState({ conditionIn: 'GOOD', returnNotes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState<{ holder: string; assetId: string } | null>(null)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    const requests: Promise<Response>[] = [fetch(`/api/allocations?${params}`)]
    if (isApprover) {
      requests.push(
        fetch('/api/assets?status=AVAILABLE&limit=100'),
        fetch('/api/employees'),
        fetch('/api/transfers'),
      )
    }
    const responses = await Promise.all(requests)
    const [allData, assetData, empData, transferData] = await Promise.all(
      responses.map((r) => r.json())
    )
    setAllocations(allData.allocations || [])
    if (isApprover) {
      setAssets(assetData?.assets || [])
      setEmployees(empData?.employees || [])
      setTransfers(transferData?.transfers || [])
    }
    setLoading(false)
  }, [statusFilter, isApprover])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleAllocate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setConflict(null)
    const res = await fetch('/api/allocations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      if (data.conflict && data.holder) setConflict({ holder: data.holder, assetId: data.assetId })
      setSubmitting(false)
      return
    }
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

  async function requestTransfer() {
    if (!conflict) return
    setSubmitting(true)
    await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId: conflict.assetId, reason: `Requested via allocation — currently held by ${conflict.holder}` }),
    })
    setShowModal(false)
    setConflict(null)
    setError('')
    setForm({ assetId: '', userId: '', expectedReturn: '', conditionOut: 'GOOD' })
    fetchData()
    setSubmitting(false)
  }

  async function decideTransfer(id: string, status: 'APPROVED' | 'REJECTED') {
    await fetch(`/api/transfers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchData()
  }

  const inputCls = 'w-full bg-white border border-[#e0ded7] text-[#1c1b18] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500'
  const labelCls = 'block text-sm font-medium text-[#57564f] mb-1.5'

  const pendingTransfers = transfers.filter((t) => t.status === 'PENDING')

  return (
    <div className="space-y-6 af-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Allocations</h1>
          <p className="text-[#8c8a80] text-[14px] mt-1">
            {isApprover ? 'Track asset assignments to employees' : 'Assets currently assigned to you'}
          </p>
        </div>
        {isApprover && (
          <button
            onClick={() => { setShowModal(true); setError(''); setConflict(null) }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" />
            New Allocation
          </button>
        )}
      </div>

      {/* Transfer requests — approver workflow */}
      {isApprover && pendingTransfers.length > 0 && (
        <div className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#efede8] flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-amber-600" />
            <h3 className="text-[14px] font-semibold text-[#1c1b18]">Pending Transfer Requests</h3>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">{pendingTransfers.length}</span>
          </div>
          <div className="divide-y divide-[#f0eee9]">
            {pendingTransfers.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-[#1c1b18]">
                    <span className="font-medium">{t.requester.name}</span> requested{' '}
                    <span className="font-medium">{t.asset.name}</span>{' '}
                    <span className="font-mono text-emerald-700 text-xs">{t.asset.assetTag}</span>
                  </div>
                  {t.reason && <div className="text-xs text-[#8c8a80] mt-0.5 truncate">{t.reason}</div>}
                </div>
                <button
                  onClick={() => decideTransfer(t.id, 'APPROVED')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-all"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  onClick={() => decideTransfer(t.id, 'REJECTED')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-all"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <SkeletonRows rows={6} cols={7} />
        ) : allocations.length === 0 ? (
          <EmptyState
            icon={Users}
            title={isApprover ? 'No allocations yet' : 'Nothing assigned to you'}
            description={isApprover ? 'Allocate an available asset to an employee to get started.' : 'Assets allocated to you will appear here.'}
          />
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
                {allocations.map(a => (
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

      {isApprover && (
        <Modal open={showModal} onClose={() => { setShowModal(false); setConflict(null); setError('') }} title="New Allocation" size="md">
          {error && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              {error}
              {conflict && (
                <button
                  type="button"
                  onClick={requestTransfer}
                  disabled={submitting}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" /> Request Transfer instead
                </button>
              )}
            </div>
          )}
          <form onSubmit={handleAllocate} className="space-y-4">
            <div>
              <label className={labelCls}>Asset *</label>
              <select value={form.assetId} onChange={e => { setForm(p => ({ ...p, assetId: e.target.value })); setConflict(null); setError('') }} required className={inputCls}>
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
              <button type="button" onClick={() => { setShowModal(false); setConflict(null); setError('') }} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-all">
                {submitting ? 'Allocating...' : 'Allocate Asset'}
              </button>
            </div>
          </form>
        </Modal>
      )}

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
