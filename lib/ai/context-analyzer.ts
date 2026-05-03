/**
 * Analyzes user prompts to determine if enough context is available
 * and suggests clarifying questions if needed
 */

export interface ContextAnalysis {
  hasEnoughContext: boolean
  missingContext: string[]
  suggestedQuestions: string[]
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Analyzes if a prompt has enough context for accurate AI response
 */
export function analyzePromptContext(
  userPrompt: string,
  availableContext: {
    hasBusinessData?: boolean
    hasRelevantContact?: boolean
    hasRelevantDeal?: boolean
    hasProducts?: boolean
    hasTasks?: boolean
    hasInvoices?: boolean
    hasDeals?: boolean
  }
): ContextAnalysis {
  const lowerPrompt = userPrompt.toLowerCase()
  const missingContext: string[] = []
  const suggestedQuestions: string[] = []

  // Detect what the user is asking for
  const isProposalRequest = lowerPrompt.includes('proposal') || lowerPrompt.includes('quote')
  const isPostRequest = lowerPrompt.includes('post') || lowerPrompt.includes('linkedin') || 
                       lowerPrompt.includes('facebook') || lowerPrompt.includes('instagram') ||
                       lowerPrompt.includes('twitter') || lowerPrompt.includes('social media')
  const isPitchDeckRequest = lowerPrompt.includes('pitch deck') || lowerPrompt.includes('pitchdeck')
  const isBusinessPlanRequest = lowerPrompt.includes('business plan') || lowerPrompt.includes('businessplan')
  const isImageRequest = lowerPrompt.includes('image') || lowerPrompt.includes('picture') || 
                        lowerPrompt.includes('generate image') || lowerPrompt.includes('create image')
  const isTaskRequest = lowerPrompt.includes('task') || lowerPrompt.includes('todo') || 
                       lowerPrompt.includes('follow up')
  const isInvoiceRequest = lowerPrompt.includes('invoice') || lowerPrompt.includes('billing')
  const isDealRequest = lowerPrompt.includes('deal') || lowerPrompt.includes('opportunity') ||
                       lowerPrompt.includes('sales')

  // Analyze context for proposals
  if (isProposalRequest) {
    if (!availableContext.hasRelevantContact) {
      missingContext.push('client/company information')
      suggestedQuestions.push('Which client or company is this proposal for?')
    }
    if (!availableContext.hasRelevantDeal) {
      missingContext.push('deal information')
      suggestedQuestions.push('What is the deal value and what stage is it in?')
    }
    if (!availableContext.hasProducts) {
      missingContext.push('products/services to offer')
      suggestedQuestions.push('What products or services should be included in this proposal?')
    }
  }

  // Analyze context for social media posts
  if (isPostRequest) {
    const hasTopic = lowerPrompt.includes('about') || lowerPrompt.includes('for') || 
                    lowerPrompt.length > 20
    if (!hasTopic) {
      missingContext.push('post topic or theme')
      suggestedQuestions.push('What should this post be about? (e.g., new product, company update, industry insight)')
    }
    const hasPlatform = lowerPrompt.includes('linkedin') || lowerPrompt.includes('facebook') ||
                       lowerPrompt.includes('instagram') || lowerPrompt.includes('twitter')
    if (!hasPlatform) {
      missingContext.push('target platform')
      suggestedQuestions.push('Which platform is this for? (LinkedIn, Facebook, Instagram, Twitter)')
    }
  }

  // Analyze context for pitch decks
  if (isPitchDeckRequest) {
    if (!availableContext.hasBusinessData) {
      missingContext.push('business information')
      suggestedQuestions.push('What key points should be highlighted about your business?')
    }
  }

  // Analyze context for business plans
  if (isBusinessPlanRequest) {
    if (!availableContext.hasBusinessData) {
      missingContext.push('business information')
      suggestedQuestions.push('What aspects of your business should be covered?')
    }
  }

  // Analyze context for image generation
  if (isImageRequest) {
    const hasSubject = lowerPrompt.length > 10 && 
                      !lowerPrompt.match(/^(generate|create|make|show)\s+(an|a|the)\s+(image|picture)/i)
    if (!hasSubject) {
      missingContext.push('image subject or description')
      suggestedQuestions.push('What should the image show? (e.g., "A modern office", "A product photo")')
    }
  }

  // Analyze context for task-related queries
  if (isTaskRequest) {
    if (!availableContext.hasTasks) {
      missingContext.push('task information')
      suggestedQuestions.push('What specific task are you referring to?')
    }
  }

  // Analyze context for invoice queries
  if (isInvoiceRequest) {
    if (!availableContext.hasInvoices) {
      missingContext.push('invoice information')
      suggestedQuestions.push('Which invoice are you asking about?')
    }
  }

  // Analyze context for deal queries
  if (isDealRequest) {
    if (!availableContext.hasDeals) {
      missingContext.push('deal information')
      suggestedQuestions.push('Which deal are you referring to?')
    }
  }

  // Generic context checks
  if (!availableContext.hasBusinessData && 
      (isProposalRequest || isPitchDeckRequest || isBusinessPlanRequest)) {
    missingContext.push('business information')
    if (!suggestedQuestions.some(q => q.includes('business'))) {
      suggestedQuestions.push('What business information should be included?')
    }
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'high'
  if (missingContext.length > 2) {
    confidence = 'low'
  } else if (missingContext.length > 0) {
    confidence = 'medium'
  }

  return {
    hasEnoughContext: missingContext.length === 0,
    missingContext,
    suggestedQuestions,
    confidence,
  }
}

/**
 * Formats clarifying questions into a user-friendly message
 */
export function formatClarifyingQuestions(analysis: ContextAnalysis): string {
  if (analysis.hasEnoughContext) {
    return ''
  }

  let message = 'To give you the most accurate response, I need a bit more information:\n\n'
  
  analysis.suggestedQuestions.forEach((question, index) => {
    message += `${index + 1}. ${question}\n`
  })

  message += '\nPlease provide these details so I can help you better!'

  return message
}
