/**
 * Alert Banner Component
 * Financial Dashboard Module 1.3
 * 
 * Displays financial alerts in the dashboard
 */

'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  X,
  CheckCircle,
  Info,
  AlertCircle,
  TrendingDown,
} from 'lucide-react'
import { useState } from 'react'

export interface FinancialAlert {
  id: string
  alertName: string
  alertType: string
  triggerDate: Date
  triggeredValue: number
  acknowledged: boolean
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

interface AlertBannerProps {
  alerts: FinancialAlert[]
  onAcknowledge?: (alertId: string) => void
  onDismiss?: (alertId: string) => void
  maxDisplay?: number
}

export function AlertBanner({
  alerts,
  onAcknowledge,
  onDismiss,
  maxDisplay = 3,
}: AlertBannerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const activeAlerts = alerts
    .filter((alert) => !alert.acknowledged && !dismissedAlerts.has(alert.id))
    .slice(0, maxDisplay)

  if (activeAlerts.length === 0) {
    return null
  }

  const getAlertIcon = (type: string, severity?: string) => {
    if (severity === 'critical') return AlertTriangle
    if (severity === 'high') return AlertCircle
    if (type === 'variance') return TrendingDown
    return Info
  }

  const getAlertVariant = (severity?: string) => {
    if (severity === 'critical') return 'destructive'
    if (severity === 'high') return 'destructive'
    if (severity === 'medium') return 'default'
    return 'default'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="space-y-2">
      {activeAlerts.map((alert) => {
        const Icon = getAlertIcon(alert.alertType, alert.severity)
        const variant = getAlertVariant(alert.severity)

        return (
          <Alert key={alert.id} variant={variant}>
            <Icon className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              <span>{alert.alertName}</span>
              <div className="flex gap-2">
                {onAcknowledge && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onAcknowledge(alert.id)
                      setDismissedAlerts((prev) => new Set(prev).add(alert.id))
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Acknowledge
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onDismiss(alert.id)
                      setDismissedAlerts((prev) => new Set(prev).add(alert.id))
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </AlertTitle>
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  {alert.alertType === 'variance' && 'Variance detected: '}
                  {alert.alertType === 'cash_flow' && 'Cash flow warning: '}
                  {alert.alertType === 'budget' && 'Budget alert: '}
                  {alert.alertType === 'anomaly' && 'Anomaly detected: '}
                  {formatCurrency(alert.triggeredValue)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.triggerDate).toLocaleDateString()}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )
      })}
    </div>
  )
}
