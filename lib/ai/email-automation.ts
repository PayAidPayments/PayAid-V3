/**
 * Automated Email Response Service
 * AI-powered email response automation
 */

import { ChatGroq } from '@langchain/groq'
import { logger } from '@/lib/logging/structured-logger'

export interface EmailContext {
  contactName?: string
  contactEmail: string
  previousEmails?: Array<{
    subject: string
    body: string
    from: string
    date: Date
  }>
  dealStage?: string
  dealValue?: number
  lastInteraction?: string
}

export interface EmailResponse {
  subject: string
  body: string
  tone: 'professional' | 'friendly' | 'formal'
  suggestedActions?: string[]
}

export class EmailAutomationService {
  private llm: ChatGroq

  constructor() {
    this.llm = new ChatGroq({
      modelName: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      apiKey: process.env.GROQ_API_KEY,
    })
  }

  /**
   * Generate automated email response
   */
  async generateResponse(
    incomingEmail: { subject: string; body: string; from: string },
    context: EmailContext
  ): Promise<EmailResponse> {
    try {
      const prompt = this.buildPrompt(incomingEmail, context)

      const response = await this.llm.invoke(prompt)

      // Parse LLM response
      const parsed = this.parseResponse(response)

      logger.info('Generated automated email response', {
        contactEmail: context.contactEmail,
        subject: parsed.subject,
      })

      return parsed
    } catch (error) {
      logger.error('Failed to generate email response', error instanceof Error ? error : undefined, {
        contactEmail: context.contactEmail,
      })
      throw error
    }
  }

  private buildPrompt(
    incomingEmail: { subject: string; body: string; from: string },
    context: EmailContext
  ): string {
    return `You are an AI assistant helping a sales team respond to customer emails.

Incoming Email:
Subject: ${incomingEmail.subject}
From: ${incomingEmail.from}
Body: ${incomingEmail.body}

Context:
- Contact: ${context.contactName || 'Unknown'} (${context.contactEmail})
- Deal Stage: ${context.dealStage || 'N/A'}
- Deal Value: ${context.dealValue ? `₹${context.dealValue.toLocaleString('en-IN')}` : 'N/A'}
- Last Interaction: ${context.lastInteraction || 'N/A'}

Previous Email History:
${context.previousEmails?.map((e) => `- ${e.subject} (${e.date.toLocaleDateString()})`).join('\n') || 'None'}

Generate a professional, helpful email response that:
1. Acknowledges the customer's email
2. Addresses their question or concern
3. Maintains a professional but friendly tone
4. Suggests next steps if appropriate

Return the response in JSON format:
{
  "subject": "Re: [original subject]",
  "body": "Email body text",
  "tone": "professional|friendly|formal",
  "suggestedActions": ["action1", "action2"]
}`
  }

  private parseResponse(response: string): EmailResponse {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      // Fallback: parse manually
      return {
        subject: `Re: ${response.split('\n')[0]}`,
        body: response,
        tone: 'professional',
      }
    } catch (error) {
      // Fallback response
      return {
        subject: 'Re: Your inquiry',
        body: response,
        tone: 'professional',
      }
    }
  }

  /**
   * Determine if email requires human response
   */
  async requiresHumanReview(
    email: { subject: string; body: string },
    context: EmailContext
  ): Promise<boolean> {
    const sensitiveKeywords = [
      'refund',
      'cancel',
      'complaint',
      'legal',
      'lawsuit',
      'urgent',
      'escalate',
      'manager',
    ]

    const hasSensitiveKeyword = sensitiveKeywords.some((keyword) =>
      (email.subject + ' ' + email.body).toLowerCase().includes(keyword)
    )

    // High-value deals always require human review
    if (context.dealValue && context.dealValue > 100000) {
      return true
    }

    return hasSensitiveKeyword
  }
}
