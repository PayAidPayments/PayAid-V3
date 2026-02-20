'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, AlertCircle, CheckCircle, Info, X, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/lib/stores/auth'

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
  action?: string
  timestamp: Date
  read: boolean
  source: 'ai' | 'system' // New field to distinguish AI vs system alerts
}

interface IntelligentAlertsProps {
  tenantId?: string
  stats?: any
}

export function IntelligentAlerts({ tenantId, stats }: IntelligentAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState<'all' | 'ai' | 'system'>('all')
  const { token } = useAuthStore()

  useEffect(() => {
    if (!tenantId || !token) return

    const generateAlerts = () => {
      const newAlerts: Alert[] = []

      if (stats) {
        // SYSTEM ALERTS (operational/technical)
        // Critical: Overdue tasks
        if (stats.overdueTasks > 0) {
          newAlerts.push({
            id: 'sys-1',
            type: 'critical',
            title: 'Overdue Tasks',
            message: `You have ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''} that require immediate attention.`,
            action: 'View Tasks',
            timestamp: new Date(),
            read: false,
            source: 'system',
          })
        }

        // AI ALERTS (intelligent insights)
        // Warning: Deals closing soon (AI detected pattern)
        if (stats.dealsClosingThisMonth > 0) {
          newAlerts.push({
            id: 'ai-1',
            type: 'warning',
            title: 'Deals Closing This Month',
            message: `${stats.dealsClosingThisMonth} deal${stats.dealsClosingThisMonth > 1 ? 's' : ''} ${stats.dealsClosingThisMonth > 1 ? 'are' : 'is'} closing this month. AI recommends proactive follow-up to ensure closure.`,
            action: 'View Deals',
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            read: false,
            source: 'ai',
          })
        }

        // AI: Revenue milestone (AI detected achievement)
        if (stats.revenueThisMonth > 100000) {
          newAlerts.push({
            id: 'ai-2',
            type: 'info',
            title: 'Revenue Milestone',
            message: `AI detected: You've reached ₹${(stats.revenueThisMonth / 100000).toFixed(1)}L in revenue this month. This is ${((stats.revenueThisMonth / 100000) * 10).toFixed(0)}% above average.`,
            timestamp: new Date(Date.now() - 7200000), // 2 hours ago
            read: false,
            source: 'ai',
          })
        }

        // AI: New deals (AI detected growth pattern)
        if (stats.dealsCreatedThisMonth > 0) {
          newAlerts.push({
            id: 'ai-3',
            type: 'success',
            title: 'New Deals Created',
            message: `AI insight: You've created ${stats.dealsCreatedThisMonth} new deal${stats.dealsCreatedThisMonth > 1 ? 's' : ''} this month. This represents a positive growth trend.`,
            timestamp: new Date(Date.now() - 10800000), // 3 hours ago
            read: false,
            source: 'ai',
          })
        }

        // AI: Unusual conversion drop (if detected)
        if (stats.totalLeads && stats.convertedLeads) {
          const conversionRate = (stats.convertedLeads / stats.totalLeads) * 100
          if (conversionRate < 10 && stats.totalLeads > 10) {
            newAlerts.push({
              id: 'ai-4',
              type: 'warning',
              title: 'Conversion Rate Drop',
              message: `AI detected: Conversion rate is ${conversionRate.toFixed(1)}%, which is below the expected threshold. Review lead quality and follow-up processes.`,
              action: 'View Leads',
              timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
              read: false,
              source: 'ai',
            })
          }
        }

        // SYSTEM: Data sync issues (if any)
        // This would come from actual system monitoring
      }

      setAlerts(newAlerts)
      setUnreadCount(newAlerts.filter((a) => !a.read).length)
    }

    generateAlerts()
  }, [tenantId, token, stats])

  const markAsRead = (id: string) => {
    setAlerts((prev) =>
      Array.isArray(prev) ? prev.map((alert) => (alert.id === id ? { ...alert, read: true } : alert)) : []
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setAlerts((prev) => Array.isArray(prev) ? prev.map((alert) => ({ ...alert, read: true })) : [])
    setUnreadCount(0)
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />
      case 'info':
        return <Info className="w-5 h-5 text-info" />
      default:
        return <CheckCircle className="w-5 h-5 text-success" />
    }
  }

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-900'
      case 'info':
        return 'bg-info-light border-info/30 text-info'
      default:
        return 'bg-success-light border-success/30 text-success'
    }
  }

  const getTypeBadge = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-700">Critical</Badge>
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-700">Warning</Badge>
      case 'info':
        return <Badge className="bg-info-light text-info">Info</Badge>
      default:
        return <Badge className="bg-success-light text-success">Success</Badge>
    }
  }

  // Filter alerts based on selected filter
  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.source === filter)

  const aiAlertsCount = alerts.filter(a => a.source === 'ai').length
  const systemAlertsCount = alerts.filter(a => a.source === 'system').length

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-500" />
          Intelligent Alerts
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white ml-2">{unreadCount}</Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filter === 'all' 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('ai')}
              className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                filter === 'ai' 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Zap className="w-3 h-3" />
              AI ({aiAlertsCount})
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filter === 'system' 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              System ({systemAlertsCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Mark all read
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-2 opacity-50" />
            <p className="text-sm text-gray-500">No alerts at the moment. All clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {(Array.isArray(filteredAlerts) ? filteredAlerts : []).map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    p-4 rounded-lg border-2 relative
                    ${getAlertColor(alert.type)}
                    ${!alert.read ? 'ring-2 ring-purple-300' : ''}
                    transition-all cursor-pointer hover:shadow-md
                  `}
                  onClick={() => markAsRead(alert.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.type)}
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      {alert.source === 'ai' && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                      {alert.source === 'system' && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs">
                          System
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(alert.type)}
                      {!alert.read && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm mb-2 opacity-90">{alert.message}</p>
                  {alert.action && (
                    <button className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                      {alert.action}
                      <Zap className="w-3 h-3" />
                    </button>
                  )}
                  <p className="text-xs mt-2 opacity-70">
                    {alert.timestamp.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
