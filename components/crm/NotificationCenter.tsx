'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, Mail, Phone, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'

interface Notification {
  id: string
  type: 'email' | 'call' | 'meeting' | 'task' | 'deal' | 'alert' | 'success'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

interface NotificationCenterProps {
  tenantId: string
}

export function NotificationCenter({ tenantId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { token } = useAuthStore()

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/crm/notifications?tenantId=${tenantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [tenantId, token])

  // Show browser notifications for new unread items
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted' && unreadCount > 0) {
      const unread = notifications.filter(n => !n.read).slice(0, 1)
      if (unread.length > 0) {
        new Notification(unread[0].title, {
          body: unread[0].message,
          icon: '/favicon.ico',
        })
      }
    }
  }, [unreadCount, notifications])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/crm/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/crm/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'call':
        return <Phone className="w-4 h-4" />
      case 'meeting':
        return <Calendar className="w-4 h-4" />
      case 'alert':
        return <AlertCircle className="w-4 h-4" />
      case 'success':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${!notification.read ? 'text-blue-600' : 'text-gray-400'}`}>
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          {notification.read ? (
                            <Check className="w-4 h-4 text-gray-400" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
