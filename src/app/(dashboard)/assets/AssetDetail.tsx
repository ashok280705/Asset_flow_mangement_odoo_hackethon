'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Package, Wrench, Calendar, History } from 'lucide-react'

interface AssetDetailData {
  id: string
  assetTag: string
  name: string
  serialNumber?: string
  status: string
  condition: string
  location?: string
  acquisitionDate: string
  acquisitionCost?: number
  isBookable: boolean
  photoUrl?: string
  notes?: string
  category?: { name: string }
  department?: { name: string }
  allocations: { id: string; allocatedAt: string; returnedAt?: string; status: string; conditionOut: string; conditionIn?: string; returnNotes?: string; user: { name: string; email: string } }[]
  maintenanceRequests: { id: string; description: string; priority: string; status: string; createdAt: string; resolvedAt?: string; raisedBy: { name: string } }[]
  bookings: { id: string; startTime: string; endTime: string; status: string; purpose?: string; user: { name: string } }[]
}

export function AssetDetail({ id }: { id: string }) {
  const [data, setData] = useState<AssetDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/assets/${id}`)
      .then(r => r.json())
      .then(d => setData(d.asset))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="af-skeleton h-6 w-48" />
        <div className="af-skeleton h-4 w-full" />
        <div className="af-skeleton h-24 w-full rounded-xl" />
      </div>
    )
  }
  if (!data) return <p className="text-[#8c8a80] text-sm py-8 text-center">Asset not found.</p>

  const facts: [string, React.ReactNode][] = [
    ['Asset Tag', <span key="t" className="font-mono text-emerald-700 font-semibold">{data.assetTag}</span>],
    ['Category', data.category?.name || '—'],
    ['Serial Number', data.serialNumber || '—'],
    ['Department', data.department?.name || '—'],
    ['Location', data.location || '—'],
    ['Acquired', formatDate(data.acquisitionDate)],
    ['Acquisition Cost', data.acquisitionCost ? `₹${Number(data.acquisitionCost).toLocaleString('en-IN')}` : '—'],
    ['Bookable', data.isBookable ? 'Yes' : 'No'],
  ]

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
      {/* header */}
      <div className="flex items-start gap-3">
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.photoUrl} alt={data.name} className="h-11 w-11 rounded-[13px] object-cover shrink-0 border border-[#eceae4]" />
        ) : (
          <span className="grid place-items-center h-11 w-11 rounded-[13px] bg-emerald-50 text-emerald-600 shrink-0">
            <Package className="h-5 w-5" />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] font-semibold text-[#1c1b18] leading-tight">{data.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge status={data.status} />
            <Badge status={data.condition} />
          </div>
        </div>
      </div>

      {/* facts grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {facts.map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-[#eceae4] bg-[#faf9f6] p-3">
            <div className="text-[10.5px] uppercase tracking-wider text-[#a8a69b] mb-1">{label}</div>
            <div className="text-[13px] text-[#1c1b18] font-medium truncate">{value}</div>
          </div>
        ))}
      </div>

      {data.notes && (
        <div className="text-[13px] text-[#57564f] bg-[#faf9f6] border border-[#eceae4] rounded-xl p-3">{data.notes}</div>
      )}

      {/* Allocation history */}
      <Section icon={History} title="Allocation History" count={data.allocations.length}>
        {data.allocations.length === 0 ? (
          <Empty text="No allocations recorded." />
        ) : (
          data.allocations.map(a => (
            <div key={a.id} className="flex items-start gap-3 py-2.5 border-b border-[#f0eee9] last:border-0">
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${a.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-stone-300'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#1c1b18]">
                  <span className="font-medium">{a.user.name}</span>
                  <span className="text-[#8c8a80]"> · {a.status.toLowerCase()}</span>
                </div>
                <div className="text-[11.5px] text-[#a8a69b] mt-0.5">
                  Out {formatDate(a.allocatedAt)} ({a.conditionOut}){a.returnedAt ? ` · In ${formatDate(a.returnedAt)}${a.conditionIn ? ` (${a.conditionIn})` : ''}` : ''}
                </div>
                {a.returnNotes && <div className="text-[11.5px] text-[#8c8a80] mt-0.5 italic">“{a.returnNotes}”</div>}
              </div>
            </div>
          ))
        )}
      </Section>

      {/* Maintenance history */}
      <Section icon={Wrench} title="Maintenance History" count={data.maintenanceRequests.length}>
        {data.maintenanceRequests.length === 0 ? (
          <Empty text="No maintenance requests." />
        ) : (
          data.maintenanceRequests.map(m => (
            <div key={m.id} className="flex items-start gap-3 py-2.5 border-b border-[#f0eee9] last:border-0">
              <span className="mt-0.5 shrink-0"><Badge status={m.status} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#1c1b18] truncate">{m.description}</div>
                <div className="text-[11.5px] text-[#a8a69b] mt-0.5">
                  {m.priority} · by {m.raisedBy.name} · {formatDate(m.createdAt)}{m.resolvedAt ? ` · resolved ${formatDate(m.resolvedAt)}` : ''}
                </div>
              </div>
            </div>
          ))
        )}
      </Section>

      {/* Booking history */}
      {data.bookings.length > 0 && (
        <Section icon={Calendar} title="Booking History" count={data.bookings.length}>
          {data.bookings.map(b => (
            <div key={b.id} className="flex items-start gap-3 py-2.5 border-b border-[#f0eee9] last:border-0">
              <span className="mt-0.5 shrink-0"><Badge status={b.status} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#1c1b18]">{b.user.name}{b.purpose ? ` — ${b.purpose}` : ''}</div>
                <div className="text-[11.5px] text-[#a8a69b] mt-0.5">{formatDateTime(b.startTime)} → {formatDateTime(b.endTime)}</div>
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ icon: Icon, title, count, children }: { icon: typeof Package; title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-4 w-4 text-[#8c8a80]" />
        <h4 className="text-[13px] font-semibold text-[#1c1b18]">{title}</h4>
        <span className="text-[11px] font-semibold text-[#8c8a80] bg-stone-100 px-1.5 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="rounded-xl border border-[#eceae4] px-3">{children}</div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="text-[12.5px] text-[#a8a69b] py-3">{text}</p>
}
