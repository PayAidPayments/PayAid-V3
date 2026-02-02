'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { AlertCircle, Bell, DollarSign, TrendingDown, Calendar, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface FinancialAlert {
  id: string
  type: 'low-cash' | 'overdue' | 'budget-variance' | 'large-transaction' | 'gst-filing' | 'payment-received'
  title: string
  message: string
  severity: 'critical' | 'warning' | 'info'
  timestamp: Date
  actionUrl?: string
  read: boolean
}

interface FinancialAlertsProps {
  tenantId: string
}

export function FinancialAlerts({ tenantId }: FinancialAlertsProps) {
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [tenantId])

  const fetchAlerts = async () => {
    try {
      const token = useAuthStore.getState().token
      const response = await fetch('/api/finance/alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAlertIcon = (type: FinancialAlert['type']) => {
    switch (type) {
      case 'low-cash':
        return <DollarSign className="w-5 h-5" />
      case 'overdue':
        return <AlertCircle className="w-5 h-5" />
      case 'budget-variance':
        return <TrendingDown className="w-5 h-5" />
      case 'gst-filing':
        return <FileText className="w-5 h-5" />
      case 'payment-received':
        return <Bell className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getSeverityColor = (severity: FinancialAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const unreadCount = alerts.filter(a => !a.read).length

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, read: true } : a
    ))
  }

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  return (
    <GlassCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Financial Alerts
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} new</Badge>
              )}
            </CardTitle>
            <CardDescription>Stay informed about important financial events</CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                !alert.read ? 'bg-white dark:bg-gray-800 border-2' : 'bg-gray-50 dark:bg-gray-900 border'
              } ${getSeverityColor(alert.severity)}`}
              onClick={() => {
                markAsRead(alert.id)
                if (alert.actionUrl) {
                  window.location.href = alert.actionUrl
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{alert.title}</h4>
                    {!alert.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    <Badge variant="outline" className="ml-auto">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm opacity-90">{alert.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {alert.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No alerts at this time</p>
            </div>
          )}
        </div>
      </CardContent>
    </GlassCard>
  )
}
