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
  ASSET: 'text-amber-400',
  MAINTENANCE: 'text-orange-400',
  BOOKING: 'text-blue-400',
  TRANSFER: 'text-purple-400',
  OVERDUE: 'text-red-400',
  AUDIT: 'text-emerald-400',
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

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Bell className="text-amber-400" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className="text-slate-400 mt-1">Stay updated on all activities</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-all"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('notifications')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'notifications' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          onClick={() => setTab('logs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'logs' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Activity Log
        </button>
      </div>

      {tab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 && (
            <Card><p className="text-slate-400 text-sm text-center py-12">No notifications yet</p></Card>
          )}
          {notifications.map(notif => {
            const Icon = TYPE_ICON[notif.type] || Bell
            const color = TYPE_COLOR[notif.type] || 'text-amber-400'
            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && markRead(notif.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-slate-800/30 border-slate-800/50 opacity-60'
                    : 'bg-slate-800 border-slate-700 hover:border-amber-500/30'
                }`}
              >
                <div className={`p-2 rounded-lg bg-slate-900 ${color} flex-shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">{notif.title}</p>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDateTime(notif.createdAt)}</p>
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
              <p className="text-slate-400 text-sm text-center py-8">No activity recorded</p>
            )}
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-900/50 transition-all">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-300">
                    <span className="font-medium text-slate-100">{log.user?.name}</span>{' '}
                    <span className="text-amber-400 font-medium">{log.action}</span>{' '}
                    <span className="text-slate-400">{log.entity}</span>
                    {log.details && <span className="text-slate-500"> — {log.details}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{formatDateTime(log.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
