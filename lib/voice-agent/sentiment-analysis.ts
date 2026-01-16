/**
 * Sentiment Analysis for Voice Calls
 * Analyzes conversation transcripts to determine sentiment
 */

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number // -1 to 1 (negative to positive)
  confidence: number // 0 to 1
  emotions?: {
    joy?: number
    sadness?: number
    anger?: number
    fear?: number
    surprise?: number
  }
}

/**
 * Analyze sentiment of text
 * Uses simple keyword-based analysis (can be enhanced with ML models)
 */
export function analyzeSentiment(text: string): SentimentResult {
  const lowerText = text.toLowerCase()

  // Positive keywords
  const positiveKeywords = [
    'good', 'great', 'excellent', 'wonderful', 'amazing', 'happy', 'satisfied',
    'thank', 'appreciate', 'love', 'perfect', 'fantastic', 'pleased', 'delighted',
    'yes', 'sure', 'okay', 'fine', 'agree', 'understood',
  ]

  // Negative keywords
  const negativeKeywords = [
    'bad', 'terrible', 'awful', 'horrible', 'angry', 'frustrated', 'disappointed',
    'no', 'not', "don't", "won't", 'refuse', 'reject', 'cancel', 'complain',
    'problem', 'issue', 'error', 'wrong', 'hate', 'dislike',
  ]

  // Count matches
  const positiveCount = positiveKeywords.filter((keyword) => lowerText.includes(keyword)).length
  const negativeCount = negativeKeywords.filter((keyword) => lowerText.includes(keyword)).length

  // Calculate score (-1 to 1)
  const totalKeywords = positiveCount + negativeCount
  const score = totalKeywords > 0
    ? (positiveCount - negativeCount) / totalKeywords
    : 0

  // Determine sentiment
  let sentiment: 'positive' | 'negative' | 'neutral'
  if (score > 0.2) {
    sentiment = 'positive'
  } else if (score < -0.2) {
    sentiment = 'negative'
  } else {
    sentiment = 'neutral'
  }

  // Calculate confidence (based on keyword density)
  const confidence = Math.min(totalKeywords / 10, 1)

  return {
    sentiment,
    score,
    confidence,
  }
}

/**
 * Analyze sentiment using Ollama (if available)
 */
export async function analyzeSentimentWithLLM(text: string): Promise<SentimentResult> {
  try {
    const { getOllamaClient } = await import('@/lib/ai/ollama')
    const ollama = getOllamaClient()

    const prompt = `Analyze the sentiment of the following text and respond with a JSON object containing:
- sentiment: "positive", "negative", or "neutral"
- score: a number between -1 and 1
- confidence: a number between 0 and 1

Text: "${text}"

Respond with JSON only, no other text.`

    const response = await ollama.chat([
      { role: 'user', content: prompt },
    ])

    try {
      const result = JSON.parse(response.message)
      return {
        sentiment: result.sentiment || 'neutral',
        score: result.score || 0,
        confidence: result.confidence || 0.5,
      }
    } catch {
      // Fallback to keyword-based analysis
      return analyzeSentiment(text)
    }
  } catch (error) {
    console.error('LLM sentiment analysis failed, using keyword-based:', error)
    return analyzeSentiment(text)
  }
}

/**
 * Analyze sentiment of conversation history
 */
export function analyzeConversationSentiment(
  messages: Array<{ role: string; content: string }>
): SentimentResult {
  const allText = messages
    .filter((msg) => msg.role === 'user')
    .map((msg) => msg.content)
    .join(' ')

  return analyzeSentiment(allText)
}

