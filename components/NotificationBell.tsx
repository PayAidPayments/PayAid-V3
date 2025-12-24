'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Alert {
  id: string
  type: string
  title: string
  message: string
  leadId?: string
  dealId?: string
  taskId?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  isRead: boolean
  createdAt: string
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
  const [showDropdown, setShowDropdown] = useState(false)

  // Fetch alerts
  const { data, isLoading } = useQuery<{ alerts: Alert[]; unreadCount: number }>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await fetch('/api/alerts?unreadOnly=false&limit=20', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        if (response.status === 401) {
          // Silently fail for unauthorized - user might not be logged in yet
          return { alerts: [], unreadCount: 0 }
        }
        throw new Error('Failed to fetch alerts')
      }
      return response.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false, // Don't retry on 401 errors
  })

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to mark as read')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  // Mark all as read mutation
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/alerts/mark-all-read', {
        method: 'PUT',
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to mark all as read')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })

  const alerts = data?.alerts || []
  const unreadCount = data?.unreadCount || 0
  const unreadAlerts = alerts.filter((a) => !a.isRead)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'border-red-500 bg-red-50'
      case 'MEDIUM':
        return 'border-yellow-500 bg-yellow-50'
      default:
        return 'border-gray-500 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'NEW_LEAD_ASSIGNED':
        return '👤'
      case 'FOLLOW_UP_DUE':
        return '📅'
      case 'HOT_LEAD':
        return '🔥'
      case 'DEAL_WON':
        return '🎉'
      case 'DEAL_LOST':
        return '❌'
      case 'TASK_DUE':
        return '✅'
      default:
        return '🔔'
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
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
          <Card className="absolute right-0 top-12 w-96 max-h-[500px] overflow-y-auto z-50 shadow-lg">
            <CardHeader className="sticky top-0 bg-white border-b z-10">
              <div className="flex items-center justify-between">
                <CardTitle>Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : alerts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                <div className="divide-y">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !alert.isRead ? getPriorityColor(alert.priority) : ''
                      }`}
                      onClick={() => {
                        if (!alert.isRead) {
                          markAsRead.mutate(alert.id)
                        }
                        setShowDropdown(false)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getTypeIcon(alert.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p
                              className={`text-sm font-medium ${
                                !alert.isRead ? 'font-semibold' : ''
                              }`}
                            >
                              {alert.title}
                            </p>
                            {!alert.isRead && (
                              <span className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{alert.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(alert.createdAt).toLocaleString()}
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
