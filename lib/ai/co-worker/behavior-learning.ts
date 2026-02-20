/**
 * Learning from User Behavior
 * Tracks user patterns and adapts AI suggestions
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'

export interface UserPattern {
  action: string
  frequency: number
  context: Record<string, unknown>
  timeOfDay?: string
  dayOfWeek?: string
}

/**
 * Track user action for learning
 */
export async function trackUserAction(
  tenantId: string,
  userId: string,
  action: string,
  context: Record<string, unknown> = {}
): Promise<void> {
  // Store in UserBehaviorLog (would need model)
  // For now, update user metadata
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (user) {
    const metadata = (user as any).metadata || {}
    const patterns = metadata.patterns || []
    
    const now = new Date()
    const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()]

    const existingPattern = patterns.find((p: UserPattern) => p.action === action)
    if (existingPattern) {
      existingPattern.frequency++
      existingPattern.context = { ...existingPattern.context, ...context }
    } else {
      patterns.push({
        action,
        frequency: 1,
        context,
        timeOfDay,
        dayOfWeek,
      })
    }

    // Update user metadata (would need to add metadata field to User model)
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: { metadata: { ...metadata, patterns } },
    // })
  }
}

/**
 * Get learned patterns for a user
 */
export async function getUserPatterns(
  tenantId: string,
  userId: string
): Promise<UserPattern[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (user) {
    const metadata = (user as any).metadata || {}
    return metadata.patterns || []
  }

  return []
}

/**
 * Predict next action based on learned patterns
 */
export async function predictNextAction(
  tenantId: string,
  userId: string,
  currentContext: Record<string, unknown>
): Promise<{ action: string; confidence: number } | null> {
  const patterns = await getUserPatterns(tenantId, userId)
  
  if (patterns.length === 0) {
    return null
  }

  // Find most frequent action in similar context
  const now = new Date()
  const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()]

  const relevantPatterns = patterns.filter((p) => {
    return p.timeOfDay === timeOfDay || p.dayOfWeek === dayOfWeek
  })

  if (relevantPatterns.length === 0) {
    return null
  }

  const mostFrequent = relevantPatterns.reduce((prev, curr) =>
    curr.frequency > prev.frequency ? curr : prev
  )

  return {
    action: mostFrequent.action,
    confidence: Math.min(mostFrequent.frequency / 10, 0.95), // Cap at 95%
  }
}
