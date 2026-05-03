type OutboxMetrics = {
  queuedCount: number
  dispatchedCount: number
  dlqCount: number
  queueCounts: Record<string, number>
}

export type OutboxAlert = {
  code: string
  severity: 'warning' | 'critical'
  message: string
}

function getThreshold(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function evaluateOutboxAlerts(metrics: OutboxMetrics): OutboxAlert[] {
  const alerts: OutboxAlert[] = []
  const dlqWarn = getThreshold('OUTBOX_DLQ_WARN_THRESHOLD', 1)
  const dlqCritical = getThreshold('OUTBOX_DLQ_CRITICAL_THRESHOLD', 5)
  const waitingWarn = getThreshold('OUTBOX_QUEUE_WAITING_WARN_THRESHOLD', 50)

  if (metrics.dlqCount >= dlqCritical) {
    alerts.push({
      code: 'OUTBOX_DLQ_CRITICAL',
      severity: 'critical',
      message: `DLQ count is ${metrics.dlqCount} (>= ${dlqCritical})`,
    })
  } else if (metrics.dlqCount >= dlqWarn) {
    alerts.push({
      code: 'OUTBOX_DLQ_WARN',
      severity: 'warning',
      message: `DLQ count is ${metrics.dlqCount} (>= ${dlqWarn})`,
    })
  }

  const waitingCount = Number(metrics.queueCounts.waiting || 0)
  if (waitingCount >= waitingWarn) {
    alerts.push({
      code: 'OUTBOX_QUEUE_WAITING_WARN',
      severity: 'warning',
      message: `Outbox queue waiting jobs ${waitingCount} (>= ${waitingWarn})`,
    })
  }

  return alerts
}
