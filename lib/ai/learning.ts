// AI Learning & Adaptation System
// Implements feedback loops and continuous learning from user interactions

import { prisma } from '@/lib/db/prisma'

export interface AIFeedback {
  id: string
  type: 'positive' | 'negative' | 'correction'
  context: string
  userInput: string
  aiResponse: string
  correctedResponse?: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface LearningInsight {
  pattern: string
  frequency: number
  suggestedImprovement: string
  confidence: number
}

/**
 * Record user feedback on AI responses
 */
export async function recordFeedback(
  tenantId: string,
  userId: string,
  feedback: {
    type: 'positive' | 'negative' | 'correction'
    context: string
    userInput: string
    aiResponse: string
    correctedResponse?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  // Store feedback in database for learning
  // In production, this would be stored in an AIFeedback model
  await prisma.interaction.create({
    data: {
      tenantId,
      type: 'note',
      subject: `AI Feedback: ${feedback.type}`,
      notes: JSON.stringify({
        context: feedback.context,
        userInput: feedback.userInput,
        aiResponse: feedback.aiResponse,
        correctedResponse: feedback.correctedResponse,
        metadata: feedback.metadata,
        feedbackType: feedback.type,
      }),
      createdByRepId: userId,
      createdAt: new Date(),
    },
  })
}

/**
 * Analyze feedback patterns to generate learning insights
 */
export async function analyzeFeedbackPatterns(
  tenantId: string
): Promise<LearningInsight[]> {
  // Fetch recent feedback interactions
  const feedbackInteractions = await prisma.interaction.findMany({
    where: {
      tenantId,
      type: 'note',
      notes: {
        contains: 'AI Feedback',
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  })

  // Analyze patterns
  const insights: LearningInsight[] = []
  const patternMap = new Map<string, number>()

  for (const interaction of feedbackInteractions) {
    try {
      const feedbackData = JSON.parse(interaction.notes || '{}')
      
      if (feedbackData.feedbackType === 'negative' || feedbackData.feedbackType === 'correction') {
        // Extract key patterns from negative feedback
        const context = feedbackData.context || ''
        const pattern = extractPattern(context)
        
        if (pattern) {
          patternMap.set(pattern, (patternMap.get(pattern) || 0) + 1)
        }
      }
    } catch (error) {
      // Skip invalid JSON
      continue
    }
  }

  // Generate insights from patterns
  for (const [pattern, frequency] of patternMap.entries()) {
    if (frequency >= 3) {
      insights.push({
        pattern,
        frequency,
        suggestedImprovement: generateImprovementSuggestion(pattern),
        confidence: Math.min(0.9, frequency / 10),
      })
    }
  }

  return insights
}

/**
 * Extract pattern from context
 */
function extractPattern(context: string): string | null {
  // Simple pattern extraction - in production, use NLP
  const lowerContext = context.toLowerCase()
  
  if (lowerContext.includes('invoice') || lowerContext.includes('billing')) {
    return 'invoice_queries'
  }
  if (lowerContext.includes('deal') || lowerContext.includes('sales')) {
    return 'deal_queries'
  }
  if (lowerContext.includes('customer') || lowerContext.includes('contact')) {
    return 'customer_queries'
  }
  if (lowerContext.includes('task') || lowerContext.includes('todo')) {
    return 'task_queries'
  }
  
  return null
}

/**
 * Generate improvement suggestion based on pattern
 */
function generateImprovementSuggestion(pattern: string): string {
  const suggestions: Record<string, string> = {
    invoice_queries: 'Improve invoice-related responses by including more context about payment status and due dates.',
    deal_queries: 'Enhance deal responses with pipeline stage information and next steps.',
    customer_queries: 'Provide more comprehensive customer information including interaction history.',
    task_queries: 'Include task dependencies and related contacts in task responses.',
  }

  return suggestions[pattern] || 'Review and improve responses for this context type.'
}

/**
 * Get adaptive prompt based on feedback history
 */
export async function getAdaptivePrompt(
  tenantId: string,
  context: string
): Promise<string> {
  const insights = await analyzeFeedbackPatterns(tenantId)
  
  // Find relevant insights
  const relevantInsights = insights.filter(insight => 
    context.toLowerCase().includes(insight.pattern.split('_')[0])
  )

  if (relevantInsights.length === 0) {
    return '' // No adaptations needed
  }

  // Build adaptive prompt
  const improvements = relevantInsights
    .map(insight => `- ${insight.suggestedImprovement}`)
    .join('\n')

  return `Based on user feedback, please ensure:\n${improvements}`
}

/**
 * Update AI model preferences based on feedback
 */
export async function updateModelPreferences(
  tenantId: string,
  preferences: {
    responseStyle?: 'concise' | 'detailed' | 'conversational'
    includeExamples?: boolean
    includeRelatedData?: boolean
  }
): Promise<void> {
  // Store preferences in tenant settings
  // In production, this would update a TenantSettings model
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      // Store in metadata or create separate settings model
      metadata: {
        aiPreferences: preferences,
      },
    },
  })
}
