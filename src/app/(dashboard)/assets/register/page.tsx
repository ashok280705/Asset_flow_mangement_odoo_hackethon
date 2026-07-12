'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Category { id: string; name: string }
interface Department { id: string; name: string }

export default function RegisterAssetPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    serialNumber: '',
    acquisitionDate: '',
    acquisitionCost: '',
    condition: 'GOOD',
    location: '',
    departmentId: '',
    isBookable: false,
    photoUrl: '',
    notes: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/departments').then(r => r.json()),
    ]).then(([catData, deptData]) => {
      setCategories(catData.categories || [])
      setDepartments(deptData.departments || [])
    })
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : undefined,
          departmentId: form.departmentId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to register asset')
      } else {
        router.push('/assets')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-white border border-[#e0ded7] text-[#1c1b18] placeholder-[#a8a69b] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-500 transition-all'
  const labelCls = 'block text-sm font-medium text-[#57564f] mb-1.5'

  return (
    <div className="max-w-2xl af-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/assets" className="p-2 hover:bg-[#faf9f6] rounded-xl transition-colors">
          <ArrowLeft className="h-4 w-4 text-[#8c8a80]" />
        </Link>
        <div>
          <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight">Register New Asset</h1>
          <p className="text-[#8c8a80] text-[14px] mt-0.5">Add a new asset to the inventory</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-[#eceae4] rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-[#e9e7e1] shadow-soft rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Asset Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Dell Laptop XPS 15" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Category *</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} required className={inputCls}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Serial Number</label>
            <input name="serialNumber" value={form.serialNumber} onChange={handleChange} placeholder="SN-XXXXXXX" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Acquisition Date *</label>
            <input type="date" name="acquisitionDate" value={form.acquisitionDate} onChange={handleChange} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Acquisition Cost (&#8377;)</label>
            <input type="number" name="acquisitionCost" value={form.acquisitionCost} onChange={handleChange} placeholder="0.00" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Condition</label>
            <select name="condition" value={form.condition} onChange={handleChange} className={inputCls}>
              {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Floor 3, Room 301" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Department</label>
            <select name="departmentId" value={form.departmentId} onChange={handleChange} className={inputCls}>
              <option value="">No department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Photo / Document URL</label>
            <input name="photoUrl" value={form.photoUrl} onChange={handleChange} placeholder="https://…/asset-photo.jpg" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Additional notes..." className={inputCls + ' resize-none'} />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isBookable"
              name="isBookable"
              checked={form.isBookable}
              onChange={handleChange}
              className="w-4 h-4 accent-emerald-600"
            />
            <label htmlFor="isBookable" className="text-sm text-[#57564f]">Allow resource booking</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/assets" className="px-4 py-2 text-sm bg-stone-100 hover:bg-[#faf9f6] text-[#1c1b18] rounded-xl transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-xs disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register Asset'}
          </button>
        </div>
      </form>
    </div>
  )
}
