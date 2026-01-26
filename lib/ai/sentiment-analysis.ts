/**
 * Advanced Sentiment Analysis Service
 * Enhanced sentiment analysis for communications
 */

import { Groq } from '@langchain/groq'
import { logger } from '@/lib/logging/structured-logger'

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  score: number // -1 to 1
  confidence: number // 0 to 1
  emotions: Array<{
    emotion: string
    score: number
  }>
  topics: string[]
  urgency: 'low' | 'medium' | 'high'
  actionRequired: boolean
  summary: string
}

export class SentimentAnalysisService {
  private llm: Groq

  constructor() {
    this.llm = new Groq({
      modelName: 'llama-3.1-70b-versatile',
      temperature: 0.3,
      apiKey: process.env.GROQ_API_KEY,
    })
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string, context?: { contactName?: string; dealStage?: string }): Promise<SentimentResult> {
    try {
      const prompt = this.buildSentimentPrompt(text, context)

      const response = await this.llm.invoke(prompt)

      const parsed = this.parseSentimentResponse(response)

      logger.info('Sentiment analysis completed', {
        sentiment: parsed.sentiment,
        score: parsed.score,
        confidence: parsed.confidence,
      })

      return parsed
    } catch (error) {
      logger.error('Sentiment analysis failed', error instanceof Error ? error : undefined)
      
      // Fallback: simple keyword-based sentiment
      return this.fallbackSentimentAnalysis(text)
    }
  }

  private buildSentimentPrompt(text: string, context?: { contactName?: string; dealStage?: string }): string {
    return `Analyze the sentiment of the following communication:

Text: "${text}"

Context:
${context?.contactName ? `- Contact: ${context.contactName}` : ''}
${context?.dealStage ? `- Deal Stage: ${context.dealStage}` : ''}

Provide a comprehensive sentiment analysis in JSON format:
{
  "sentiment": "positive|negative|neutral|mixed",
  "score": -1.0 to 1.0,
  "confidence": 0.0 to 1.0,
  "emotions": [
    {"emotion": "happy|sad|angry|frustrated|excited|concerned", "score": 0.0 to 1.0}
  ],
  "topics": ["topic1", "topic2"],
  "urgency": "low|medium|high",
  "actionRequired": true|false,
  "summary": "Brief summary of sentiment and key points"
}`
  }

  private parseSentimentResponse(response: string): SentimentResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      // Fallback parsing
    }

    return this.fallbackSentimentAnalysis(response)
  }

  private fallbackSentimentAnalysis(text: string): SentimentResult {
    const lowerText = text.toLowerCase()
    
    const positiveWords = ['great', 'excellent', 'good', 'happy', 'pleased', 'thanks', 'thank you', 'yes', 'agreed']
    const negativeWords = ['bad', 'terrible', 'unhappy', 'disappointed', 'problem', 'issue', 'no', 'refund', 'cancel']
    
    let positiveCount = 0
    let negativeCount = 0
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++
    })
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++
    })

    const score = positiveCount > negativeCount ? 0.5 : negativeCount > positiveCount ? -0.5 : 0
    const sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'

    return {
      sentiment,
      score,
      confidence: 0.6,
      emotions: [],
      topics: [],
      urgency: 'medium',
      actionRequired: negativeCount > 0,
      summary: `Detected ${sentiment} sentiment based on keywords`,
    }
  }

  /**
   * Analyze email thread sentiment
   */
  async analyzeEmailThread(emails: Array<{ subject: string; body: string; from: string; date: Date }>): Promise<{
    overallSentiment: SentimentResult
    trend: 'improving' | 'declining' | 'stable'
    keyConcerns: string[]
  }> {
    const sentiments = await Promise.all(
      emails.map((email) => this.analyzeSentiment(`${email.subject} ${email.body}`))
    )

    const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length
    const overallSentiment = sentiments[sentiments.length - 1] // Latest sentiment

    // Determine trend
    const recentScores = sentiments.slice(-3).map((s) => s.score)
    const trend =
      recentScores.length >= 2
        ? recentScores[recentScores.length - 1] > recentScores[0]
          ? 'improving'
          : recentScores[recentScores.length - 1] < recentScores[0]
            ? 'declining'
            : 'stable'
        : 'stable'

    // Extract key concerns from negative sentiments
    const keyConcerns = sentiments
      .filter((s) => s.sentiment === 'negative')
      .flatMap((s) => s.topics)
      .filter((topic, index, arr) => arr.indexOf(topic) === index) // Unique

    return {
      overallSentiment: {
        ...overallSentiment,
        score: avgScore,
      },
      trend,
      keyConcerns,
    }
  }
}
