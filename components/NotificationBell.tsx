'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
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
  metadata?: any
}

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export function NotificationBell() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)

  // Track consecutive 503 errors to back off polling
  const [consecutive503Errors, setConsecutive503Errors] = useState(0)

  // Fetch notifications from all modules
  const { data, isLoading } = useQuery<{ notifications: Notification[]; unreadCount: number; total: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications?limit=50', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        if (response.status === 401) {
          // Reset 503 counter on 401 (auth issue, not DB)
          setConsecutive503Errors(0)
          return { notifications: [], unreadCount: 0, total: 0 }
        }
        if (response.status === 503) {
          // Increment 503 counter - database is unavailable
          setConsecutive503Errors(prev => prev + 1)
          return { notifications: [], unreadCount: 0, total: 0 }
        }
        throw new Error('Failed to fetch notifications')
      }
      // Success - reset 503 counter
      setConsecutive503Errors(0)
      return response.json()
    },
    // Back off polling when database is unavailable:
    // - Normal: 30 seconds
    // - After 1-2 503s: 60 seconds
    // - After 3+ 503s: 120 seconds (2 minutes)
    refetchInterval: consecutive503Errors === 0 
      ? 30000 
      : consecutive503Errors <= 2 
        ? 60000 
        : 120000,
    retry: false, // Don't retry on 401/503 errors
  })

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
      case 'MEDIUM':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TASK_OVERDUE':
      case 'TASK_DUE_TODAY':
        return '✅'
      case 'DEAL_CLOSING':
        return '💰'
      case 'INVOICE_OVERDUE':
      case 'BILL_DUE':
        return '💳'
      case 'LEAVE_PENDING':
        return '📅'
      case 'ATTENDANCE_MISSING':
        return '⏰'
      case 'PROJECT_TASK_DUE':
        return '📋'
      case 'STOCK_LOW':
        return '📦'
      case 'APPOINTMENT_TODAY':
        return '📞'
      default:
        return '🔔'
    }
  }

  const getModuleBadgeColor = (module: string) => {
    const colors: Record<string, string> = {
      crm: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      finance: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      hr: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      projects: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      inventory: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      appointments: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      marketing: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    }
    return colors[module] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  const handleNotificationClick = (notification: Notification) => {
    setShowDropdown(false)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <Card className="absolute right-0 top-12 w-96 max-h-[600px] overflow-y-auto z-50 shadow-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-gray-100">Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l-4',
                        !notification.isRead ? getPriorityColor(notification.priority) : 'border-l-transparent bg-white dark:bg-gray-800'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{getTypeIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <p
                              className={cn(
                                'text-sm font-medium text-gray-900 dark:text-gray-100',
                                !notification.isRead && 'font-semibold'
                              )}
                            >
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge className={cn('text-xs', getModuleBadgeColor(notification.module))}>
                                {notification.module.toUpperCase()}
                              </Badge>
                              {!notification.isRead && (
                                <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
