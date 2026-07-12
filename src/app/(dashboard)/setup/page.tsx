'use client'
import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePermissions } from '@/components/SessionProvider'
import { Building2, Tag, Users, Plus, Lock } from 'lucide-react'

interface Department { id: string; name: string; code: string; status: string; parentId?: string | null; headId?: string | null; _count: { users: number; assets: number } }
interface Category { id: string; name: string; description?: string; warrantyPeriod?: number; _count: { assets: number } }
interface Employee { id: string; name: string; email: string; role: string; status: string; departmentId?: string | null; department?: { name: string } }

export default function SetupPage() {
  const { isAdmin } = usePermissions()
  const [tab, setTab] = useState<'departments' | 'categories' | 'employees'>('departments')
  const [departments, setDepartments] = useState<Department[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const [deptModal, setDeptModal] = useState(false)
  const [catModal, setCatModal] = useState(false)
  const [roleModal, setRoleModal] = useState<{ open: boolean; id: string; name: string; role: string }>({ open: false, id: '', name: '', role: '' })

  const [deptForm, setDeptForm] = useState({ name: '', code: '', parentId: '' })
  const [catForm, setCatForm] = useState({ name: '', description: '', warrantyPeriod: '' })
  const [newRole, setNewRole] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [deptEdit, setDeptEdit] = useState<{ open: boolean; id: string; name: string; code: string; parentId: string; headId: string; status: string }>({ open: false, id: '', name: '', code: '', parentId: '', headId: '', status: 'ACTIVE' })
  const [catEdit, setCatEdit] = useState<{ open: boolean; id: string; name: string; description: string; warrantyPeriod: string }>({ open: false, id: '', name: '', description: '', warrantyPeriod: '' })

  async function saveDeptEdit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setError('')
    const res = await fetch(`/api/departments/${deptEdit.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: deptEdit.name, code: deptEdit.code, parentId: deptEdit.parentId, headId: deptEdit.headId, status: deptEdit.status }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setDeptEdit(p => ({ ...p, open: false })); fetchAll(); setSubmitting(false)
  }

  async function saveCatEdit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setError('')
    const res = await fetch(`/api/categories/${catEdit.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catEdit.name, description: catEdit.description, warrantyPeriod: catEdit.warrantyPeriod || undefined }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setCatEdit(p => ({ ...p, open: false })); fetchAll(); setSubmitting(false)
  }

  async function updateEmployee(id: string, patch: { status?: string; departmentId?: string }) {
    await fetch(`/api/employees/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
    fetchAll()
  }

  async function fetchAll() {
    setLoading(true)
    const [dRes, cRes, eRes] = await Promise.all([
      fetch('/api/departments').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/employees').then(r => r.json()),
    ])
    setDepartments(dRes.departments || [])
    setCategories(cRes.categories || [])
    setEmployees(eRes.employees || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  async function createDept(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deptForm),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setDeptModal(false)
    setDeptForm({ name: '', code: '', parentId: '' })
    fetchAll()
    setSubmitting(false)
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...catForm, warrantyPeriod: catForm.warrantyPeriod ? Number(catForm.warrantyPeriod) : undefined }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSubmitting(false); return }
    setCatModal(false)
    setCatForm({ name: '', description: '', warrantyPeriod: '' })
    fetchAll()
    setSubmitting(false)
  }

  async function updateRole(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch(`/api/employees/${roleModal.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    setRoleModal({ open: false, id: '', name: '', role: '' })
    fetchAll()
    setSubmitting(false)
  }

  const inputCls = 'w-full bg-white border border-[#e0ded7] text-[#1c1b18] placeholder-[#a8a69b] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20'
  const labelCls = 'block text-sm font-medium text-[#57564f] mb-1.5'

  const tabs = [
    { key: 'departments', label: 'Departments', icon: Building2 },
    { key: 'categories', label: 'Categories', icon: Tag },
    { key: 'employees', label: 'Employees', icon: Users },
  ] as const

  if (!isAdmin) {
    return (
      <div className="af-fade-in">
        <div className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl">
          <EmptyState
            icon={Lock}
            title="Admin access required"
            description="Organization setup — departments, categories and role assignment — is managed by administrators only."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 af-fade-in">
      <div>
        <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Organization Setup</h1>
        <p className="text-[#8c8a80] mt-1">Configure departments, categories, and employee roles</p>
      </div>

      <div className="flex gap-1 bg-white border border-[#eceae4] shadow-soft rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-[#8c8a80] hover:text-[#1c1b18]'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setDeptModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? <div className="col-span-3 text-center text-[#8c8a80] py-12 animate-pulse">Loading...</div> :
              departments.map(d => (
                <div key={d.id} className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl p-5 af-hover-lift">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-[#1c1b18]">{d.name}</div>
                      <div className="text-xs font-mono text-emerald-700 mt-0.5">{d.code}</div>
                    </div>
                    <Badge status={d.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-sm text-[#8c8a80]">
                      <span>{d._count.users} employees</span>
                      <span>{d._count.assets} assets</span>
                    </div>
                    <button
                      onClick={() => setDeptEdit({ open: true, id: d.id, name: d.name, code: d.code, parentId: d.parentId || '', headId: d.headId || '', status: d.status })}
                      className="text-xs text-[#57564f] hover:text-[#1c1b18] bg-stone-100 hover:bg-[#faf9f6] px-2.5 py-1 rounded-lg transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setCatModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? <div className="col-span-3 text-center text-[#8c8a80] py-12 animate-pulse">Loading...</div> :
              categories.map(c => (
                <div key={c.id} className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl p-5 af-hover-lift">
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-semibold text-[#1c1b18]">{c.name}</div>
                    <button
                      onClick={() => setCatEdit({ open: true, id: c.id, name: c.name, description: c.description || '', warrantyPeriod: c.warrantyPeriod ? String(c.warrantyPeriod) : '' })}
                      className="text-xs text-[#57564f] hover:text-[#1c1b18] bg-stone-100 hover:bg-[#faf9f6] px-2.5 py-1 rounded-lg transition-all"
                    >
                      Edit
                    </button>
                  </div>
                  {c.description && <div className="text-sm text-[#8c8a80] mb-2">{c.description}</div>}
                  <div className="flex gap-4 text-sm text-[#8c8a80]">
                    <span>{c._count.assets} assets</span>
                    {c.warrantyPeriod && <span>{c.warrantyPeriod}mo warranty</span>}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {tab === 'employees' && (
        <div className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#eceae4] bg-[#faf9f6]">
                  {['Name', 'Email', 'Department', 'Role', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-[#8c8a80] uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee9]">
                {loading ? (
                  <tr><td colSpan={6} className="text-center text-[#8c8a80] py-12 animate-pulse">Loading...</td></tr>
                ) : employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-[#faf9f6] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#1c1b18]">{emp.name}</td>
                    <td className="px-4 py-3 text-[#8c8a80]">{emp.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={emp.departmentId || ''}
                        onChange={e => updateEmployee(emp.id, { departmentId: e.target.value })}
                        className="text-xs bg-white border border-[#e0ded7] rounded-lg px-2 py-1 text-[#57564f] focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      >
                        <option value="">No department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{emp.role.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3"><Badge status={emp.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setRoleModal({ open: true, id: emp.id, name: emp.name, role: emp.role }); setNewRole(emp.role) }}
                          className="text-xs text-[#57564f] hover:text-[#1c1b18] bg-stone-100 hover:bg-[#faf9f6] px-2.5 py-1 rounded-lg transition-all"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => updateEmployee(emp.id, { status: emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                          className={`text-xs px-2.5 py-1 rounded-lg transition-all ${emp.status === 'ACTIVE' ? 'text-rose-600 bg-rose-50 hover:bg-rose-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                        >
                          {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={deptModal} onClose={() => setDeptModal(false)} title="Add Department" size="sm">
        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{error}</div>}
        <form onSubmit={createDept} className="space-y-4">
          <div>
            <label className={labelCls}>Department Name *</label>
            <input value={deptForm.name} onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Information Technology" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Code *</label>
            <input value={deptForm.code} onChange={e => setDeptForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required placeholder="e.g. IT" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Parent Department</label>
            <select value={deptForm.parentId} onChange={e => setDeptForm(p => ({ ...p, parentId: e.target.value }))} className={inputCls}>
              <option value="">None (Top level)</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setDeptModal(false)} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={catModal} onClose={() => setCatModal(false)} title="Add Category" size="sm">
        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{error}</div>}
        <form onSubmit={createCategory} className="space-y-4">
          <div>
            <label className={labelCls}>Category Name *</label>
            <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Electronics" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))} rows={2} className={inputCls + ' resize-none'} placeholder="Category description..." />
          </div>
          <div>
            <label className={labelCls}>Warranty Period (months)</label>
            <input type="number" value={catForm.warrantyPeriod} onChange={e => setCatForm(p => ({ ...p, warrantyPeriod: e.target.value }))} placeholder="e.g. 24" className={inputCls} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setCatModal(false)} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={roleModal.open} onClose={() => setRoleModal({ open: false, id: '', name: '', role: '' })} title={`Change Role: ${roleModal.name}`} size="sm">
        <form onSubmit={updateRole} className="space-y-4">
          <div>
            <label className={labelCls}>New Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} className={inputCls}>
              {['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'EMPLOYEE'].map(r => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setRoleModal({ open: false, id: '', name: '', role: '' })} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {submitting ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Department */}
      <Modal open={deptEdit.open} onClose={() => setDeptEdit(p => ({ ...p, open: false }))} title="Edit Department" size="sm">
        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{error}</div>}
        <form onSubmit={saveDeptEdit} className="space-y-4">
          <div>
            <label className={labelCls}>Department Name *</label>
            <input value={deptEdit.name} onChange={e => setDeptEdit(p => ({ ...p, name: e.target.value }))} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Code *</label>
            <input value={deptEdit.code} onChange={e => setDeptEdit(p => ({ ...p, code: e.target.value.toUpperCase() }))} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Department Head</label>
            <select value={deptEdit.headId} onChange={e => setDeptEdit(p => ({ ...p, headId: e.target.value }))} className={inputCls}>
              <option value="">Unassigned</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Parent Department</label>
            <select value={deptEdit.parentId} onChange={e => setDeptEdit(p => ({ ...p, parentId: e.target.value }))} className={inputCls}>
              <option value="">None (Top level)</option>
              {departments.filter(d => d.id !== deptEdit.id).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={deptEdit.status} onChange={e => setDeptEdit(p => ({ ...p, status: e.target.value }))} className={inputCls}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setDeptEdit(p => ({ ...p, open: false }))} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Category */}
      <Modal open={catEdit.open} onClose={() => setCatEdit(p => ({ ...p, open: false }))} title="Edit Category" size="sm">
        {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">{error}</div>}
        <form onSubmit={saveCatEdit} className="space-y-4">
          <div>
            <label className={labelCls}>Category Name *</label>
            <input value={catEdit.name} onChange={e => setCatEdit(p => ({ ...p, name: e.target.value }))} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={catEdit.description} onChange={e => setCatEdit(p => ({ ...p, description: e.target.value }))} rows={2} className={inputCls + ' resize-none'} />
          </div>
          <div>
            <label className={labelCls}>Warranty Period (months)</label>
            <input type="number" value={catEdit.warrantyPeriod} onChange={e => setCatEdit(p => ({ ...p, warrantyPeriod: e.target.value }))} className={inputCls} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setCatEdit(p => ({ ...p, open: false }))} className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
