/**
 * Company-Specific Fine-Tuning System
 * Collects training data and manages custom model training
 */

import { prisma } from '@/lib/db/prisma'

export interface TrainingDataPoint {
  prompt: string
  response: string
  context?: Record<string, any>
  feedback?: 'positive' | 'negative' | 'neutral'
  source: 'decision' | 'invoice' | 'customer_interaction' | 'user_correction'
  metadata?: Record<string, any>
}

export interface TrainingDataset {
  tenantId: string
  dataPoints: TrainingDataPoint[]
  totalCount: number
  qualityScore: number // 0-1, based on data quality checks
  lastUpdated: Date
}

/**
 * Collect training data from various sources
 */
export async function collectTrainingData(tenantId: string): Promise<TrainingDataPoint[]> {
  const dataPoints: TrainingDataPoint[] = []

  // 1. Collect from past AI decisions
  const decisions = await prisma.aIDecision.findMany({
    where: {
      tenantId,
      status: { in: ['executed', 'approved'] },
      executedAt: { not: null },
    },
    take: 500,
    orderBy: { createdAt: 'desc' },
    // AIDecision doesn't have decisionOutcome relation
  })

  for (const decision of decisions) {
    if (decision.recommendation && decision.reasoningChain) {
      dataPoints.push({
        prompt: `Context: ${decision.description}\nQuestion: What should we do?`,
        response: decision.reasoningChain,
        context: {
          type: decision.type,
          riskScore: decision.riskScore,
          approvalLevel: decision.approvalLevel,
        },
        feedback: decision.status === 'executed' ? 'positive' : 'negative',
        source: 'decision',
        metadata: {
          decisionId: decision.id,
          executedAt: decision.executedAt,
        },
      })
    }
  }

  // 2. Collect from invoice patterns (if we have invoice-related AI interactions)
  // This would come from AI Co-Founder conversations about invoices
  // AICofounderConversation.messages is Json, not a relation
  // We'll filter after fetching
  const allConversations = await prisma.aICofounderConversation.findMany({
    where: {
      tenantId,
    },
    take: 200,
    orderBy: { createdAt: 'desc' },
  })

  // Filter conversations that mention invoice in messages
  const invoiceConversations = allConversations.filter((conv) => {
    const messages = conv.messages as any
    if (Array.isArray(messages)) {
      return messages.some((m: any) => 
        m.content && typeof m.content === 'string' && m.content.toLowerCase().includes('invoice')
      )
    }
    return false
  })

  for (const conversation of invoiceConversations) {
    const messages = conversation.messages as any[]
    if (messages && messages.length >= 2) {
      const userMessage = messages.find((m) => m.role === 'user')
      const aiMessage = messages.find((m) => m.role === 'assistant')
      if (userMessage && aiMessage) {
        dataPoints.push({
          prompt: userMessage.content,
          response: aiMessage.content,
          source: 'invoice',
          metadata: {
            conversationId: conversation.id,
          },
        })
      }
    }
  }

  // 3. Collect from customer interactions (CRM conversations)
  // Task model doesn't have notes field, use description instead
  const customerInteractions = await prisma.task.findMany({
    where: {
      tenantId,
      description: { contains: 'customer' },
    },
    take: 200,
    orderBy: { createdAt: 'desc' },
  })

  for (const interaction of customerInteractions) {
    if (interaction.description) {
      dataPoints.push({
        prompt: `Customer interaction: ${interaction.title}`,
        response: interaction.description,
        source: 'customer_interaction',
        metadata: {
          taskId: interaction.id,
        },
      })
    }
  }

  // 4. Collect user corrections/feedback
  // This would come from a feedback system where users correct AI responses
  // For now, we'll use decision outcomes as feedback
  const outcomes = await prisma.decisionOutcome.findMany({
    where: {
      tenantId,
      wasRolledBack: true, // Rolled back decisions indicate corrections
    },
    take: 100,
    orderBy: { createdAt: 'desc' },
  })

  for (const outcome of outcomes) {
    const decision = await prisma.aIDecision.findUnique({
      where: { id: outcome.decisionId },
    })
    if (decision && decision.reasoningChain) {
      dataPoints.push({
        prompt: `Context: ${decision.description}`,
        response: `CORRECTED: ${outcome.executionError || 'Decision was rolled back'}`,
        feedback: 'negative',
        source: 'user_correction',
        metadata: {
          outcomeId: outcome.id,
          rolledBackAt: outcome.createdAt,
        },
      })
    }
  }

  return dataPoints
}

/**
 * Format training data as prompt-response pairs for fine-tuning
 */
export function formatTrainingData(dataPoints: TrainingDataPoint[]): Array<{
  prompt: string
  completion: string
  metadata?: Record<string, any>
}> {
  return dataPoints.map((point) => ({
    prompt: point.prompt,
    completion: point.response,
    metadata: {
      source: point.source,
      feedback: point.feedback,
      ...point.metadata,
    },
  }))
}

/**
 * Quality checks for training data
 */
export function validateTrainingData(dataPoints: TrainingDataPoint[]): {
  isValid: boolean
  qualityScore: number
  issues: string[]
} {
  const issues: string[] = []
  let qualityScore = 1.0

  // Check minimum data points
  if (dataPoints.length < 100) {
    issues.push(`Insufficient data: ${dataPoints.length} points (minimum 100 required)`)
    qualityScore -= 0.3
  }

  // Check data diversity
  const sourceCounts = dataPoints.reduce((acc, point) => {
    acc[point.source] = (acc[point.source] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const uniqueSources = Object.keys(sourceCounts).length
  if (uniqueSources < 2) {
    issues.push(`Low diversity: Only ${uniqueSources} data source(s)`)
    qualityScore -= 0.2
  }

  // Check prompt/response length
  const shortPrompts = dataPoints.filter((p) => p.prompt.length < 10).length
  const shortResponses = dataPoints.filter((p) => p.response.length < 10).length

  if (shortPrompts > dataPoints.length * 0.1) {
    issues.push(`${shortPrompts} prompts are too short (< 10 chars)`)
    qualityScore -= 0.1
  }

  if (shortResponses > dataPoints.length * 0.1) {
    issues.push(`${shortResponses} responses are too short (< 10 chars)`)
    qualityScore -= 0.1
  }

  // Check feedback distribution
  const feedbackCounts = dataPoints.reduce((acc, point) => {
    if (point.feedback) {
      acc[point.feedback] = (acc[point.feedback] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const hasFeedback = Object.keys(feedbackCounts).length > 0
  if (!hasFeedback) {
    issues.push('No feedback data available')
    qualityScore -= 0.1
  }

  qualityScore = Math.max(0, qualityScore)

  return {
    isValid: qualityScore >= 0.6 && dataPoints.length >= 100,
    qualityScore,
    issues,
  }
}

/**
 * Get training dataset for a company
 */
export async function getTrainingDataset(tenantId: string): Promise<TrainingDataset | null> {
  const dataPoints = await collectTrainingData(tenantId)
  const validation = validateTrainingData(dataPoints)

  if (!validation.isValid) {
    return null
  }

  return {
    tenantId,
    dataPoints,
    totalCount: dataPoints.length,
    qualityScore: validation.qualityScore,
    lastUpdated: new Date(),
  }
}

/**
 * Export training data in format suitable for fine-tuning
 */
export async function exportTrainingDataForFineTuning(
  tenantId: string,
  format: 'jsonl' | 'json' = 'jsonl'
): Promise<string> {
  const dataset = await getTrainingDataset(tenantId)

  if (!dataset) {
    throw new Error('Training dataset is not valid or insufficient')
  }

  const formatted = formatTrainingData(dataset.dataPoints)

  if (format === 'jsonl') {
    // JSONL format (one JSON object per line)
    return formatted.map((item) => JSON.stringify(item)).join('\n')
  } else {
    // JSON array format
    return JSON.stringify(formatted, null, 2)
  }
}
