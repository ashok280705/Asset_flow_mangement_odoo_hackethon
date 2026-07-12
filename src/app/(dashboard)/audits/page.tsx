'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import { Plus, ClipboardList } from 'lucide-react'

interface AuditCycle {
  id: string
  name: string
  scope: string
  startDate: string
  endDate: string
  status: string
  createdAt: string
  department?: { name: string }
  assignments: { auditor: { name: string } }[]
  _count: { items: number }
}

interface Department { id: string; name: string }
interface Employee { id: string; name: string; email: string }

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [form, setForm] = useState({ name: '', scope: '', departmentId: '', startDate: '', endDate: '', auditorIds: [] as string[] })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchData() {
    setLoading(true)
    const [auditRes, deptRes, empRes] = await Promise.all([
      fetch('/api/audits'),
      fetch('/api/departments'),
      fetch('/api/employees'),
    ])
    const [auditData, deptData, empData] = await Promise.all([auditRes.json(), deptRes.json(), empRes.json()])
    setAudits(auditData.audits || [])
    setDepartments(deptData.departments || [])
    setEmployees(empData.employees || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setShowModal(false)
    fetchData()
    setSubmitting(false)
  }

  async function closeAudit(id: string) {
    await fetch(`/api/audits/${id}/close`, { method: 'PATCH' })
    fetchData()
  }

  const inputCls = 'w-full bg-white border border-[#e0ded7] text-[#1c1b18] placeholder-[#a8a69b] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20'
  const labelCls = 'block text-sm font-medium text-[#57564f] mb-1.5'

  return (
    <div className="space-y-6 af-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Audit Cycles</h1>
          <p className="text-[#8c8a80] mt-1">Physical verification and compliance audits</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-xs"
        >
          <Plus className="h-4 w-4" />
          New Audit Cycle
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[#8c8a80] animate-pulse bg-white rounded-2xl border border-[#e9e7e1] shadow-soft">Loading...</div>
        ) : audits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 bg-white rounded-2xl border border-[#e9e7e1] shadow-soft">
            <ClipboardList className="h-12 w-12 text-[#c0bdb2]" />
            <p className="text-[#8c8a80]">No audit cycles created</p>
          </div>
        ) : (
          audits.map(audit => (
            <div key={audit.id} className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl p-6 af-hover-lift">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-[#1c1b18]">{audit.name}</h3>
                    <Badge status={audit.status} />
                  </div>
                  <div className="text-sm text-[#8c8a80] mb-3">Scope: {audit.scope}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-[#a8a69b] text-xs uppercase tracking-wider mb-1">Department</div>
                      <div className="text-[#57564f]">{audit.department?.name || 'All'}</div>
                    </div>
                    <div>
                      <div className="text-[#a8a69b] text-xs uppercase tracking-wider mb-1">Start Date</div>
                      <div className="text-[#57564f]">{formatDate(audit.startDate)}</div>
                    </div>
                    <div>
                      <div className="text-[#a8a69b] text-xs uppercase tracking-wider mb-1">End Date</div>
                      <div className="text-[#57564f]">{formatDate(audit.endDate)}</div>
                    </div>
                    <div>
                      <div className="text-[#a8a69b] text-xs uppercase tracking-wider mb-1">Items</div>
                      <div className="text-[#57564f]">{audit._count.items}</div>
                    </div>
                  </div>
                  {audit.assignments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs text-[#a8a69b]">Auditors:</span>
                      {audit.assignments.map((a, i) => (
                        <span key={i} className="text-xs bg-stone-100 text-[#57564f] px-2 py-0.5 rounded-full">{a.auditor.name}</span>
                      ))}
                    </div>
                  )}
                </div>
                {audit.status !== 'CLOSED' && (
                  <button
                    onClick={() => closeAudit(audit.id)}
                    className="flex-shrink-0 text-sm text-[#57564f] hover:text-[#1c1b18] bg-stone-100 hover:bg-[#faf9f6] px-3 py-1.5 rounded-xl transition-all"
                  >
                    Close Audit
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Audit Cycle" size="lg">
        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Audit Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Q1 2025 IT Assets Audit" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Scope *</label>
              <input value={form.scope} onChange={e => setForm(p => ({ ...p, scope: e.target.value }))} required placeholder="e.g. IT Department" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Department</label>
              <select value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))} className={inputCls}>
                <option value="">All departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date *</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Assign Auditors</label>
            <div className="max-h-40 overflow-y-auto space-y-2 bg-[#faf9f6] border border-[#e0ded7] rounded-xl p-3">
              {employees.map(emp => (
                <label key={emp.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-emerald-600"
                    checked={form.auditorIds.includes(emp.id)}
                    onChange={e => setForm(p => ({
                      ...p,
                      auditorIds: e.target.checked
                        ? [...p.auditorIds, emp.id]
                        : p.auditorIds.filter(id => id !== emp.id)
                    }))}
                  />
                  <span className="text-sm text-[#57564f]">{emp.name} <span className="text-[#a8a69b]">— {emp.email}</span></span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Audit Cycle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
