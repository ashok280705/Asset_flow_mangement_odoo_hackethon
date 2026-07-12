'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'
import { Bell, CheckCheck, AlertTriangle, Calendar, Wrench, Package, RefreshCw } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

interface ActivityLog {
  id: string
  action: string
  entity: string
  details: string | null
  createdAt: string
  user: { name: string }
}

const TYPE_ICON: Record<string, React.ElementType> = {
  ASSET: Package,
  MAINTENANCE: Wrench,
  BOOKING: Calendar,
  TRANSFER: RefreshCw,
  OVERDUE: AlertTriangle,
  AUDIT: CheckCheck,
}

const TYPE_COLOR: Record<string, string> = {
  ASSET: 'text-emerald-600',
  MAINTENANCE: 'text-orange-600',
  BOOKING: 'text-teal-600',
  TRANSFER: 'text-violet-600',
  OVERDUE: 'text-rose-600',
  AUDIT: 'text-emerald-600',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'notifications' | 'logs'>('notifications')

  useEffect(() => {
    Promise.all([
      fetch('/api/notifications').then(r => r.json()),
      fetch('/api/activity-logs').then(r => r.json()),
    ]).then(([n, l]) => {
      setNotifications(n.notifications || [])
      setLogs(l.logs || [])
    }).finally(() => setLoading(false))
  }, [])

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read)
    await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })))
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) return <div className="flex items-center justify-center h-64 text-[#8c8a80] animate-pulse">Loading...</div>

  return (
    <div className="space-y-6 af-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-[#1c1b18] tracking-tight flex items-center gap-2">
            <Bell className="text-emerald-600" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className="text-[#8c8a80] mt-1">Stay updated on all activities</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e6e4dd] hover:bg-[#faf9f6] text-[#57564f] text-sm rounded-xl transition-all"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-[#faf9f6] border border-[#eceae4] p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('notifications')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'notifications' ? 'bg-emerald-600 text-white' : 'text-[#8c8a80] hover:text-[#1c1b18]'}`}
        >
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          onClick={() => setTab('logs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'logs' ? 'bg-emerald-600 text-white' : 'text-[#8c8a80] hover:text-[#1c1b18]'}`}
        >
          Activity Log
        </button>
      </div>

      {tab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 && (
            <Card><p className="text-[#8c8a80] text-sm text-center py-12">No notifications yet</p></Card>
          )}
          {notifications.map(notif => {
            const Icon = TYPE_ICON[notif.type] || Bell
            const color = TYPE_COLOR[notif.type] || 'text-emerald-600'
            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && markRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-white border-[#f0eee9] opacity-60'
                    : 'bg-white border-[#e9e7e1] shadow-soft hover:border-emerald-600/30 af-hover-lift'
                }`}
              >
                <div className={`p-2 rounded-xl bg-[#faf9f6] ${color} flex-shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1c1b18]">{notif.title}</p>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-[#57564f] mt-0.5">{notif.message}</p>
                  <p className="text-xs text-[#a8a69b] mt-1">{formatDateTime(notif.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'logs' && (
        <Card title="Full Activity Log">
          <div className="space-y-2">
            {logs.length === 0 && (
              <p className="text-[#8c8a80] text-sm text-center py-8">No activity recorded</p>
            )}
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#faf9f6] transition-all">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#57564f]">
                    <span className="font-medium text-[#1c1b18]">{log.user?.name}</span>{' '}
                    <span className="text-emerald-700 font-medium">{log.action}</span>{' '}
                    <span className="text-[#8c8a80]">{log.entity}</span>
                    {log.details && <span className="text-[#a8a69b]"> — {log.details}</span>}
                  </div>
                  <div className="text-xs text-[#a8a69b] mt-0.5">{formatDateTime(log.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
