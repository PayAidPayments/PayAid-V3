/**
 * A/B Testing Framework for Voice Agents
 * FREE implementation - code logic only, no paid services
 * 
 * Allows testing different agent configurations to optimize performance
 */

import { prisma } from '@/lib/db/prisma'

export interface ExperimentVariant {
  id: string
  name: string
  config: {
    systemPrompt?: string
    language?: string
    voiceId?: string
    voiceTone?: string
    temperature?: number
    [key: string]: any
  }
  weight?: number // Traffic percentage (0-100)
}

export interface ExperimentMetrics {
  totalCalls: number
  completedCalls: number
  averageDuration: number
  averageSentiment: number
  successRate: number
  costPerCall: number
}

export class ABTestingFramework {
  /**
   * Assign a variant to a call based on experiment configuration
   * @param experimentId - Experiment ID
   * @param callId - Call ID
   * @returns Assigned variant ID
   */
  async assignVariant(experimentId: string, callId: string): Promise<string> {
    const experiment = await prisma.voiceAgentExperiment.findUnique({
      where: { id: experimentId },
    })

    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`)
    }

    if (experiment.status !== 'active') {
      throw new Error(`Experiment ${experimentId} is not active`)
    }

    const variants = (experiment.variants as unknown as ExperimentVariant[]) || []
    const trafficSplit = experiment.trafficSplit as Record<string, number>

    // Calculate variant based on traffic split
    const variantId = this.selectVariant(variants, trafficSplit, callId)

    // Record assignment
    await prisma.voiceAgentExperimentAssignment.create({
      data: {
        experimentId,
        callId,
        variant: variantId,
      },
    })

    console.log(`[ABTesting] Assigned variant ${variantId} to call ${callId}`)
    return variantId
  }

  /**
   * Select variant based on traffic split
   * Uses consistent hashing to ensure same call always gets same variant
   */
  private selectVariant(
    variants: ExperimentVariant[],
    trafficSplit: Record<string, number>,
    callId: string
  ): string {
    // Use consistent hashing based on callId
    const hash = this.hashString(callId)
    const hashValue = hash % 100 // 0-99

    let cumulative = 0
    for (const variant of variants) {
      const weight = trafficSplit[variant.id] || variant.weight || 0
      cumulative += weight

      if (hashValue < cumulative) {
        return variant.id
      }
    }

    // Fallback to first variant
    return variants[0]?.id || ''
  }

  /**
   * Simple hash function for consistent assignment
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Record experiment metrics for a call
   */
  async recordMetrics(
    experimentId: string,
    callId: string,
    metrics: {
      duration?: number
      sentiment?: number
      sentimentScore?: number
      cost?: number
      completed?: boolean
      success?: boolean
    }
  ): Promise<void> {
    const assignment = await prisma.voiceAgentExperimentAssignment.findFirst({
      where: {
        experimentId,
        callId,
      },
    })

    if (!assignment) {
      console.warn(`[ABTesting] No assignment found for call ${callId} in experiment ${experimentId}`)
      return
    }

    // Update assignment with metrics
    await prisma.voiceAgentExperimentAssignment.update({
      where: { id: assignment.id },
      data: {
        metrics: {
          ...((assignment.metrics as any) || {}),
          ...metrics,
          recordedAt: new Date().toISOString(),
        },
      },
    })
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string): Promise<{
    variants: Record<string, ExperimentMetrics>
    winner?: string
    confidence?: number
  }> {
    const experiment = await prisma.voiceAgentExperiment.findUnique({
      where: { id: experimentId },
      include: {
        assignments: {
          include: {
            call: {
              include: {
                metadata: true,
              },
            },
          },
        },
      },
    })

    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`)
    }

    const variants = (experiment.variants as unknown as ExperimentVariant[]) || []
    const results: Record<string, ExperimentMetrics> = {}

    // Calculate metrics per variant
    for (const variant of variants) {
      const variantAssignments = experiment.assignments.filter(
        a => a.variant === variant.id
      )

      const calls = variantAssignments.map(a => a.call)
      const completedCalls = calls.filter(c => c.status === 'completed')
      const durations = completedCalls
        .map(c => c.durationSeconds || 0)
        .filter(d => d > 0)
      const sentiments = completedCalls
        .map(c => {
          const score = c.metadata?.sentimentScore
          return score ? Number(score) : null
        })
        .filter((s): s is number => s !== null && s !== undefined)
      const costs = completedCalls
        .map(c => Number(c.costRupees || 0))
        .filter(c => c > 0)

      const totalCalls = calls.length
      const completed = completedCalls.length
      const averageDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0
      const averageSentiment = sentiments.length > 0
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
        : 0
      const successRate = totalCalls > 0 ? (completed / totalCalls) * 100 : 0
      const costPerCall = costs.length > 0
        ? costs.reduce((a, b) => a + b, 0) / costs.length
        : 0

      results[variant.id] = {
        totalCalls,
        completedCalls: completed,
        averageDuration,
        averageSentiment,
        successRate,
        costPerCall,
      }
    }

    // Determine winner (highest success rate, then lowest cost)
    let winner: string | undefined
    let bestScore = -1

    for (const [variantId, metrics] of Object.entries(results)) {
      // Score = success rate * 0.7 + (100 - costPerCall normalized) * 0.3
      const maxCost = Math.max(...Object.values(results).map(m => m.costPerCall), 1)
      const normalizedCost = maxCost > 0 ? (1 - metrics.costPerCall / maxCost) * 100 : 0
      const score = metrics.successRate * 0.7 + normalizedCost * 0.3

      if (score > bestScore) {
        bestScore = score
        winner = variantId
      }
    }

    // Calculate confidence (statistical significance)
    const confidence = this.calculateConfidence(results)

    return {
      variants: results,
      winner,
      confidence,
    }
  }

  /**
   * Calculate statistical confidence
   * Simple implementation - can be enhanced with proper statistical tests
   */
  private calculateConfidence(
    results: Record<string, ExperimentMetrics>
  ): number {
    const variants = Object.entries(results)
    if (variants.length < 2) return 0

    // Simple confidence based on sample size and difference
    const [variant1, variant2] = variants
    const n1 = variant1[1].totalCalls
    const n2 = variant2[1].totalCalls
    const p1 = variant1[1].successRate / 100
    const p2 = variant2[1].successRate / 100

    if (n1 < 30 || n2 < 30) {
      return 0 // Need more samples
    }

    // Simple difference test
    const diff = Math.abs(p1 - p2)
    if (diff < 0.05) {
      return 0 // No significant difference
    }

    // Higher confidence with larger sample and difference
    const minSample = Math.min(n1, n2)
    const confidence = Math.min(95, diff * 100 + (minSample / 100))

    return Math.round(confidence)
  }

  /**
   * Get active experiments for an agent
   */
  async getActiveExperiments(agentId: string) {
    return await prisma.voiceAgentExperiment.findMany({
      where: {
        agentId,
        status: 'active',
        startDate: {
          lte: new Date(),
        },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Pause an experiment
   */
  async pauseExperiment(experimentId: string): Promise<void> {
    await prisma.voiceAgentExperiment.update({
      where: { id: experimentId },
      data: { status: 'paused' },
    })
  }

  /**
   * Resume a paused experiment
   */
  async resumeExperiment(experimentId: string): Promise<void> {
    await prisma.voiceAgentExperiment.update({
      where: { id: experimentId },
      data: { status: 'active' },
    })
  }

  /**
   * End an experiment and calculate final results
   */
  async endExperiment(experimentId: string): Promise<any> {
    const results = await this.getExperimentResults(experimentId)

    await prisma.voiceAgentExperiment.update({
      where: { id: experimentId },
      data: {
        status: 'completed',
        endDate: new Date(),
        metrics: results as any, // Cast to any for Json field compatibility
      },
    })

    return results
  }
}

// Singleton instance
let abTestingInstance: ABTestingFramework | null = null

/**
 * Get A/B Testing Framework singleton
 */
export function getABTestingFramework(): ABTestingFramework {
  if (!abTestingInstance) {
    abTestingInstance = new ABTestingFramework()
  }
  return abTestingInstance
}
