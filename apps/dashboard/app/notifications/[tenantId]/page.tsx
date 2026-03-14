'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Bell, ArrowLeft, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { PageLoading } from '@/components/ui/loading'
import { cn } from '@/lib/utils/cn'

interface Notification {
  id: string
  type: string
  module: string
  title: string
  message: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

export default function NotificationsCenterPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()

  const { data, isLoading } = useQuery<{ notifications: Notification[]; unreadCount: number; total: number }>({
    queryKey: ['notifications-center', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
  })

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  if (isLoading) return <PageLoading message="Loading notifications..." fullScreen={false} />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={tenantId ? `/home/${tenantId}` : '/home'} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Notifications</h1>
          </div>
        </div>
        {unreadCount > 0 && (
          <span className="text-sm text-slate-500 dark:text-slate-400">{unreadCount} unread</span>
        )}
      </div>
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                !n.isRead && 'bg-blue-50/50 dark:bg-blue-950/20'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })} · {n.module}
                  </p>
                </div>
                {n.actionUrl && (
                  <Link
                    href={n.actionUrl}
                    className="shrink-0 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
