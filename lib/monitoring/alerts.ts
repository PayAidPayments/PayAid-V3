/**
 * Monitoring Alerts
 * 
 * Alert system for monitoring critical metrics
 */

interface AlertRule {
  name: string
  condition: (metrics: any) => boolean
  severity: 'critical' | 'warning' | 'info'
  message: string
}

/**
 * Check alert conditions and return active alerts
 */
export function checkAlerts(metrics: {
  api: {
    errorRate: number
    avgResponseTime: number
  }
  cache: {
    hitRate: number
  }
  database: {
    slowQueries: number
    primaryConnections: number
  }
}): Array<{ severity: string; message: string; timestamp: string }> {
  const alerts: Array<{ severity: string; message: string; timestamp: string }> = []

  // Alert rules
  const rules: AlertRule[] = [
    {
      name: 'High Error Rate',
      condition: (m) => m.api.errorRate > 0.01, // > 1%
      severity: 'critical',
      message: `Error rate is ${(metrics.api.errorRate * 100).toFixed(2)}% (threshold: 1%)`,
    },
    {
      name: 'Slow Response Time',
      condition: (m) => m.api.avgResponseTime > 1000, // > 1s
      severity: 'warning',
      message: `Average response time is ${metrics.api.avgResponseTime.toFixed(2)}ms (threshold: 1000ms)`,
    },
    {
      name: 'Low Cache Hit Rate',
      condition: (m) => m.cache.hitRate < 0.5, // < 50%
      severity: 'warning',
      message: `Cache hit rate is ${(metrics.cache.hitRate * 100).toFixed(2)}% (threshold: 50%)`,
    },
    {
      name: 'Many Slow Queries',
      condition: (m) => m.database.slowQueries > 10,
      severity: 'warning',
      message: `${metrics.database.slowQueries} slow queries detected`,
    },
    {
      name: 'High Database Connections',
      condition: (m) => m.database.primaryConnections > 80,
      severity: 'warning',
      message: `${metrics.database.primaryConnections} active database connections (threshold: 80)`,
    },
  ]

  // Check each rule
  for (const rule of rules) {
    if (rule.condition(metrics)) {
      alerts.push({
        severity: rule.severity,
        message: rule.message,
        timestamp: new Date().toISOString(),
      })
    }
  }

  return alerts
}

/**
 * Send alert notification (placeholder - implement with your notification system)
 */
export async function sendAlert(alert: { severity: string; message: string; timestamp: string }): Promise<void> {
  // TODO: Implement alert sending (email, Slack, PagerDuty, etc.)
  console.warn(`[ALERT ${alert.severity.toUpperCase()}] ${alert.message}`)
  
  // Example: Send to Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *${alert.severity.toUpperCase()}*: ${alert.message}`,
          timestamp: alert.timestamp,
        }),
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }
}
