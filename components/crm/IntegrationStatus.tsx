'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, RefreshCw, Mail, Calendar, Phone, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Integration {
  id: string
  name: string
  type: 'email' | 'calendar' | 'phone' | 'payment' | 'crm' | 'other'
  status: 'connected' | 'disconnected' | 'syncing' | 'error'
  lastSync?: Date
  icon: React.ReactNode
  description: string
}

interface IntegrationStatusProps {
  tenantId: string
}

export function IntegrationStatus({ tenantId }: IntegrationStatusProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'email',
      name: 'Email Sync',
      type: 'email',
      status: 'connected',
      lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      icon: <Mail className="w-5 h-5" />,
      description: 'Gmail/Outlook email synchronization',
    },
    {
      id: 'calendar',
      name: 'Calendar Sync',
      type: 'calendar',
      status: 'connected',
      lastSync: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      icon: <Calendar className="w-5 h-5" />,
      description: 'Google Calendar / Outlook Calendar',
    },
    {
      id: 'phone',
      name: 'Phone Integration',
      type: 'phone',
      status: 'connected',
      lastSync: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
      icon: <Phone className="w-5 h-5" />,
      description: 'Call logging and recording',
    },
    {
      id: 'payment',
      name: 'Payment Gateway',
      type: 'payment',
      status: 'disconnected',
      icon: <Zap className="w-5 h-5" />,
      description: 'Razorpay / Stripe integration',
    },
  ])

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
      case 'syncing':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'error':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      case 'disconnected':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4" />
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'error':
        return <XCircle className="w-4 h-4" />
      case 'disconnected':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never'
    const minutesAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60))
    if (minutesAgo < 1) return 'Just now'
    if (minutesAgo < 60) return `${minutesAgo} min ago`
    const hoursAgo = Math.floor(minutesAgo / 60)
    if (hoursAgo < 24) return `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`
    const daysAgo = Math.floor(hoursAgo / 24)
    return `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`
  }

  const handleSync = async (integrationId: string) => {
    // Trigger sync
    setIntegrations(prev => prev.map(i => 
      i.id === integrationId ? { ...i, status: 'syncing' as const } : i
    ))
    
    // Simulate sync
    setTimeout(() => {
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { ...i, status: 'connected' as const, lastSync: new Date() }
          : i
      ))
    }, 2000)
  }

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Integration Status</CardTitle>
        <CardDescription>Manage and monitor your CRM integrations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {integration.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {integration.name}
                    </h4>
                    <Badge className={getStatusColor(integration.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(integration.status)}
                        {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                      </span>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {integration.description}
                  </p>
                  {integration.lastSync && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Last synced: {formatLastSync(integration.lastSync)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {integration.status === 'connected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(integration.id)}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Sync Now
                  </Button>
                )}
                {integration.status === 'disconnected' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      // Open connection dialog
                    }}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </GlassCard>
  )
}
