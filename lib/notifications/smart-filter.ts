/**
 * Smart Notification Filter
 * Filters notifications to show only critical/important ones
 * FREE implementation using rule-based filtering
 */

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  module?: string
  timestamp: Date
  read?: boolean
  actionUrl?: string
}

export interface UserNotificationPreferences {
  userId: string
  ignoredTypes: string[]
  preferredChannels: string[]
  quietHours?: { start: string; end: string }
}

/**
 * Calculate importance score for a notification
 * Higher score = more important
 */
export function calculateImportanceScore(
  notification: Notification,
  userPreferences?: UserNotificationPreferences
): number {
  let score = 0

  // Priority-based scoring
  switch (notification.priority) {
    case 'HIGH':
      score += 50
      break
    case 'MEDIUM':
      score += 25
      break
    case 'LOW':
      score += 10
      break
  }

  // Type-based scoring (critical types get higher scores)
  const criticalTypes = [
    'TASK_OVERDUE',
    'INVOICE_OVERDUE',
    'DEAL_CLOSING_TODAY',
    'PAYMENT_FAILED',
    'SYSTEM_ALERT',
    'CHURN_RISK_HIGH',
  ]
  if (criticalTypes.includes(notification.type)) {
    score += 30
  }

  // Time-based scoring (recent notifications are more important)
  const hoursSinceNotification = (Date.now() - notification.timestamp.getTime()) / (1000 * 60 * 60)
  if (hoursSinceNotification < 1) {
    score += 20 // Very recent
  } else if (hoursSinceNotification < 24) {
    score += 10 // Today
  } else if (hoursSinceNotification > 72) {
    score -= 20 // Old notifications less important
  }

  // User preferences (reduce score for ignored types)
  if (userPreferences?.ignoredTypes.includes(notification.type)) {
    score -= 40
  }

  // Module-based scoring (business-critical modules)
  const criticalModules = ['finance', 'sales', 'crm']
  if (notification.module && criticalModules.includes(notification.module)) {
    score += 15
  }

  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, score))
}

/**
 * Filter notifications to show only important ones
 */
export function filterSmartNotifications(
  notifications: Notification[],
  options: {
    minScore?: number // Minimum importance score to show (default: 30)
    maxCount?: number // Maximum number of notifications to show (default: 10)
    userPreferences?: UserNotificationPreferences
  } = {}
): Notification[] {
  const { minScore = 30, maxCount = 10, userPreferences } = options

  // Calculate scores for all notifications
  const scoredNotifications = notifications.map((notif) => ({
    notification: notif,
    score: calculateImportanceScore(notif, userPreferences),
  }))

  // Filter by minimum score
  const importantNotifications = scoredNotifications
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score) // Sort by score (highest first)
    .slice(0, maxCount) // Limit to max count
    .map((item) => item.notification)

  return importantNotifications
}

/**
 * Group notifications by importance
 */
export function groupNotificationsByImportance(
  notifications: Notification[],
  userPreferences?: UserNotificationPreferences
): {
  critical: Notification[]
  important: Notification[]
  normal: Notification[]
} {
  const scored = notifications.map((notif) => ({
    notification: notif,
    score: calculateImportanceScore(notif, userPreferences),
  }))

  return {
    critical: scored
      .filter((item) => item.score >= 70)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.notification),
    important: scored
      .filter((item) => item.score >= 40 && item.score < 70)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.notification),
    normal: scored
      .filter((item) => item.score < 40)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.notification),
  }
}

/**
 * Check if notification should be shown based on quiet hours
 */
export function shouldShowInQuietHours(
  notification: Notification,
  quietHours?: { start: string; end: string }
): boolean {
  if (!quietHours) return true

  const now = new Date()
  const currentHour = now.getHours()
  const [startHour] = quietHours.start.split(':').map(Number)
  const [endHour] = quietHours.end.split(':').map(Number)

  // If quiet hours span midnight (e.g., 22:00 - 06:00)
  if (startHour > endHour) {
    return currentHour < startHour && currentHour >= endHour
  }

  // Normal quiet hours (e.g., 22:00 - 06:00)
  return currentHour >= startHour || currentHour < endHour
}

/**
 * Get smart notification summary
 */
export function getSmartNotificationSummary(
  notifications: Notification[],
  userPreferences?: UserNotificationPreferences
): {
  total: number
  critical: number
  important: number
  normal: number
  unread: number
} {
  const grouped = groupNotificationsByImportance(notifications, userPreferences)

  return {
    total: notifications.length,
    critical: grouped.critical.length,
    important: grouped.important.length,
    normal: grouped.normal.length,
    unread: notifications.filter((n) => !n.read).length,
  }
}
