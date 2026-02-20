/**
 * AI Email Assistant Service
 * Categorizes emails, suggests replies, extracts tasks, and prioritizes
 */

import { getGroqClient } from '@/lib/ai/groq'

export interface EmailAnalysis {
  category: 'support' | 'sales' | 'billing' | 'general' | 'spam'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sentiment: 'positive' | 'neutral' | 'negative'
  actionItems: string[]
  suggestedReply?: string
  summary: string
}

/**
 * Analyze email content
 */
export async function analyzeEmail(
  subject: string,
  body: string,
  fromEmail: string
): Promise<EmailAnalysis> {
  const groq = getGroqClient()

  const prompt = `Analyze the following email and provide:
1. Category: support, sales, billing, general, or spam
2. Priority: low, medium, high, or urgent
3. Sentiment: positive, neutral, or negative
4. Action items: List of actionable items (empty array if none)
5. Summary: Brief summary of the email

Email Subject: ${subject}
Email Body: ${body}
From: ${fromEmail}

Return JSON format:
{
  "category": "support",
  "priority": "high",
  "sentiment": "negative",
  "actionItems": ["Respond to customer query", "Check order status"],
  "summary": "Customer asking about order status"
}`

  try {
    const response = await groq.generateCompletion(prompt)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Email analysis error:', error)
  }

  // Fallback analysis
  return {
    category: 'general',
    priority: 'medium',
    sentiment: 'neutral',
    actionItems: [],
    summary: 'Email analysis unavailable',
  }
}

/**
 * Suggest reply template
 */
export async function suggestReply(
  subject: string,
  body: string,
  category: string
): Promise<string> {
  const groq = getGroqClient()

  const prompt = `Generate a professional email reply for the following ${category} email.

Subject: ${subject}
Body: ${body}

Generate a concise, professional reply. Return only the reply text, no additional formatting.`

  try {
    const response = await groq.generateCompletion(prompt)
    return response.trim()
  } catch (error) {
    console.error('Reply suggestion error:', error)
    return 'Thank you for your email. We will get back to you soon.'
  }
}

/**
 * Extract action items from email
 */
export async function extractActionItems(subject: string, body: string): Promise<string[]> {
  const groq = getGroqClient()

  const prompt = `Extract actionable items from the following email. Return a JSON array of action items.

Subject: ${subject}
Body: ${body}

Return format: ["Action item 1", "Action item 2"]
Return empty array [] if no action items found.`

  try {
    const response = await groq.generateCompletion(prompt)
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error('Action item extraction error:', error)
  }

  return []
}
