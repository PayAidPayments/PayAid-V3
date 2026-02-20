/**
 * Decision Batch Processor
 * Optimizes decision processing for high-volume scenarios
 */

import { prisma } from '@/lib/db/prisma'
import { executeDecision } from './decision-executor'
import { trackDecisionOutcome } from './risk-policy-manager'

export interface BatchProcessOptions {
  tenantId?: string
  batchSize?: number
  maxConcurrency?: number
}

/**
 * Process pending decisions in batches
 */
export async function processDecisionBatch(
  options: BatchProcessOptions = {}
): Promise<{
  processed: number
  succeeded: number
  failed: number
}> {
  const { tenantId, batchSize = 10, maxConcurrency = 5 } = options

  const where: any = {
    status: 'approved',
    executedAt: null, // Not yet executed
  }
  if (tenantId) where.tenantId = tenantId

  // Get pending approved decisions
  const decisions = await prisma.aIDecision.findMany({
    where,
    take: batchSize,
    orderBy: { createdAt: 'asc' },
  })

  if (decisions.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 }
  }

  // Process in parallel with concurrency limit
  const results = await processWithConcurrency(
    decisions,
    async (decision) => {
      try {
        const executionResult = await executeDecision({
          id: decision.id,
          type: decision.type,
          description: decision.description,
          recommendation: decision.recommendation as any,
          metadata: {},
          tenantId: decision.tenantId,
          requestedBy: decision.requestedBy,
        })

        // Update decision status
        await prisma.aIDecision.update({
          where: { id: decision.id },
          data: {
            status: executionResult.success ? 'executed' : 'failed',
            executionResult: executionResult as any,
            executedAt: new Date(),
          },
        })

        // Track outcome
        await trackDecisionOutcome({
          decisionId: decision.id,
          tenantId: decision.tenantId,
          decisionType: decision.type as any,
          riskScore: decision.riskScore,
          approvalLevel: decision.approvalLevel,
          status: executionResult.success ? 'executed' : 'failed',
          wasApproved: true,
          wasRejected: false,
          wasRolledBack: false,
          executionSuccess: executionResult.success,
          executionError: executionResult.error,
          createdAt: new Date(),
        })

        return { success: true, decisionId: decision.id }
      } catch (error) {
        console.error(`Failed to process decision ${decision.id}:`, error)
        return { success: false, decisionId: decision.id, error: String(error) }
      }
    },
    maxConcurrency
  )

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return {
    processed: decisions.length,
    succeeded,
    failed,
  }
}

/**
 * Process items with concurrency limit
 */
async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = []
  const executing: Promise<void>[] = []

  for (const item of items) {
    const promise = processor(item).then((result) => {
      results.push(result)
    })

    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      )
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * Auto-expire old pending approvals
 */
export async function expireOldApprovals(): Promise<number> {
  const expired = await prisma.approvalQueue.findMany({
    where: {
      expiresAt: { lt: new Date() },
    },
    include: {
      decision: true,
    },
  })

  let expiredCount = 0

  for (const queue of expired) {
    if (queue.decision.status === 'pending') {
      await prisma.aIDecision.update({
        where: { id: queue.decisionId },
        data: {
          status: 'rejected',
        },
      })

      expiredCount++
    }
  }

  return expiredCount
}
