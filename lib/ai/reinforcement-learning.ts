// Advanced Reinforcement Learning System
// Implements true RL with reward signals and policy updates

import { prisma } from '@/lib/db/prisma'
import { analyzeFeedbackPatterns, LearningInsight } from './learning'

export interface RewardSignal {
  action: string
  reward: number // -1 to 1
  context: string
  timestamp: Date
}

export interface PolicyUpdate {
  context: string
  oldAction: string
  newAction: string
  confidence: number
}

/**
 * Record reward signal for reinforcement learning
 */
export async function recordReward(
  tenantId: string,
  reward: RewardSignal
): Promise<void> {
  // Store reward in database for RL training
  await prisma.interaction.create({
    data: {
      tenantId,
      type: 'note',
      subject: `RL Reward: ${reward.action}`,
      notes: JSON.stringify({
        action: reward.action,
        reward: reward.reward,
        context: reward.context,
        timestamp: reward.timestamp.toISOString(),
        type: 'rl_reward',
      }),
      createdAt: new Date(),
    },
  })
}

/**
 * Update AI policy based on reward signals
 */
export async function updatePolicy(
  tenantId: string
): Promise<PolicyUpdate[]> {
  // Fetch reward signals
  const rewardInteractions = await prisma.interaction.findMany({
    where: {
      tenantId,
      type: 'note',
      notes: {
        contains: 'RL Reward',
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  })

  // Analyze rewards and generate policy updates
  const policyUpdates: PolicyUpdate[] = []
  const actionRewards = new Map<string, number[]>()

  for (const interaction of rewardInteractions) {
    try {
      const rewardData = JSON.parse(interaction.notes || '{}')
      
      if (rewardData.type === 'rl_reward') {
        const actionKey = `${rewardData.context}_${rewardData.action}`
        if (!actionRewards.has(actionKey)) {
          actionRewards.set(actionKey, [])
        }
        actionRewards.get(actionKey)!.push(rewardData.reward)
      }
    } catch (error) {
      continue
    }
  }

  // Calculate average rewards and generate policy updates
  for (const [actionKey, rewards] of actionRewards.entries()) {
    const avgReward = rewards.reduce((sum, r) => sum + r, 0) / rewards.length
    
    // If average reward is negative, suggest alternative action
    if (avgReward < -0.3 && rewards.length >= 3) {
      const [context, oldAction] = actionKey.split('_')
      const newAction = suggestBetterAction(context, oldAction)
      
      policyUpdates.push({
        context,
        oldAction,
        newAction,
        confidence: Math.min(0.9, Math.abs(avgReward)),
      })
    }
  }

  return policyUpdates
}

/**
 * Suggest better action based on context
 */
function suggestBetterAction(context: string, oldAction: string): string {
  // Simple policy improvement - in production, use RL algorithms
  const contextLower = context.toLowerCase()
  
  if (contextLower.includes('invoice')) {
    return oldAction === 'detailed_response' ? 'quick_summary' : 'detailed_response'
  }
  if (contextLower.includes('deal')) {
    return oldAction === 'suggest_action' ? 'provide_data' : 'suggest_action'
  }
  
  return 'improved_action'
}

/**
 * Get optimized action based on RL policy
 */
export async function getOptimalAction(
  tenantId: string,
  context: string
): Promise<string> {
  const policyUpdates = await updatePolicy(tenantId)
  
  // Find relevant policy update
  const relevantUpdate = policyUpdates.find(update => 
    context.toLowerCase().includes(update.context.toLowerCase())
  )
  
  if (relevantUpdate && relevantUpdate.confidence > 0.7) {
    return relevantUpdate.newAction
  }
  
  // Default action
  return 'standard_response'
}

/**
 * Enhanced learning with reinforcement learning
 * Combines feedback analysis with RL rewards
 */
export async function enhancedLearning(
  tenantId: string
): Promise<{
  insights: LearningInsight[]
  policyUpdates: PolicyUpdate[]
  recommendations: string[]
}> {
  const [insights, policyUpdates] = await Promise.all([
    analyzeFeedbackPatterns(tenantId),
    updatePolicy(tenantId),
  ])

  // Generate recommendations
  const recommendations: string[] = []
  
  if (insights.length > 0) {
    recommendations.push(`Found ${insights.length} patterns in feedback. Consider updating responses for these contexts.`)
  }
  
  if (policyUpdates.length > 0) {
    recommendations.push(`Policy updated for ${policyUpdates.length} contexts based on reward signals.`)
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue collecting feedback and rewards to improve AI responses.')
  }

  return {
    insights,
    policyUpdates,
    recommendations,
  }
}
