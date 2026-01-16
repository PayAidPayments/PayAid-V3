import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

interface ConversationMetrics {
  totalConversations: number
  averageSentiment: number
  positiveSentiment: number
  neutralSentiment: number
  negativeSentiment: number
  averageResponseTime: number
  totalDuration: number
  channels: {
    email: number
    whatsapp: number
    sms: number
    call: number
  }
}

interface ConversationInsight {
  contactId: string
  contactName: string
  channel: string
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  lastInteraction: string
  interactionCount: number
  averageResponseTime: number
  topics: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

// Simple sentiment analysis (in production, use a proper NLP service)
function analyzeSentiment(text: string): { sentiment: 'positive' | 'neutral' | 'negative'; score: number } {
  const lowerText = text.toLowerCase()
  
  const positiveWords = ['great', 'excellent', 'good', 'thanks', 'thank you', 'happy', 'satisfied', 'love', 'amazing', 'wonderful']
  const negativeWords = ['bad', 'terrible', 'awful', 'disappointed', 'unhappy', 'angry', 'frustrated', 'problem', 'issue', 'complaint']
  
  let positiveCount = 0
  let negativeCount = 0
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++
  })
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++
  })
  
  if (positiveCount > negativeCount) {
    return { sentiment: 'positive', score: Math.min(100, 50 + (positiveCount * 10)) }
  } else if (negativeCount > positiveCount) {
    return { sentiment: 'negative', score: Math.max(0, 50 - (negativeCount * 10)) }
  }
  
  return { sentiment: 'neutral', score: 50 }
}

// GET /api/crm/conversation-intelligence - Get conversation intelligence data
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams
    const contactId = searchParams.get('contactId') // Optional: filter by contact

    // Get interactions (emails, WhatsApp, SMS)
    const whereClause: any = { tenantId }
    if (contactId) {
      whereClause.contactId = contactId
    }

    const [interactions, scheduledEmails, whatsappConversations, smsReports] = await Promise.all([
      // Email interactions
      prisma.interaction.findMany({
        where: whereClause,
        select: {
          id: true,
          contactId: true,
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          type: true,
          subject: true,
          notes: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1000, // Limit for performance
      }),
      // Scheduled emails
      prisma.scheduledEmail.findMany({
        where: whereClause,
        select: {
          id: true,
          contactId: true,
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          subject: true,
          body: true,
          sentAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1000,
      }),
      // WhatsApp conversations (if available)
      prisma.whatsappConversation.findMany({
        where: whereClause,
        select: {
          id: true,
          contactId: true,
          messages: true,
          startedAt: true,
        },
        orderBy: {
          startedAt: 'desc',
        },
        take: 500,
      }),
      // SMS reports
      prisma.sMSDeliveryReport.findMany({
        where: whereClause,
        select: {
          id: true,
          contactId: true,
          message: true,
          status: true,
          sentAt: true,
        },
        orderBy: {
          sentAt: 'desc',
        },
        take: 500,
      }),
    ])

    // Process all conversations
    const allConversations: ConversationInsight[] = []
    const sentimentScores: number[] = []

    // Process email interactions
    interactions.forEach(interaction => {
      const text = `${interaction.subject || ''} ${interaction.notes || ''}`
      if (text.trim()) {
        const sentiment = analyzeSentiment(text)
        sentimentScores.push(sentiment.score)
        
        allConversations.push({
          contactId: interaction.contactId || '',
          contactName: interaction.contact?.name || 'Unknown',
          channel: 'email',
          sentiment: sentiment.sentiment,
          sentimentScore: sentiment.score,
          lastInteraction: interaction.createdAt.toISOString(),
          interactionCount: 1,
          averageResponseTime: 0, // Can be calculated if we have response times
          topics: extractTopics(text),
          riskLevel: sentiment.sentiment === 'negative' ? 'high' : sentiment.sentiment === 'positive' ? 'low' : 'medium',
        })
      }
    })

    // Process scheduled emails
    scheduledEmails.forEach(email => {
      const text = `${email.subject || ''} ${email.body || ''}`
      if (text.trim()) {
        const sentiment = analyzeSentiment(text)
        sentimentScores.push(sentiment.score)
        
        allConversations.push({
          contactId: email.contactId || '',
          contactName: email.contact?.name || 'Unknown',
          channel: 'email',
          sentiment: sentiment.sentiment,
          sentimentScore: sentiment.score,
          lastInteraction: email.sentAt?.toISOString() || email.createdAt.toISOString(),
          interactionCount: 1,
          averageResponseTime: 0,
          topics: extractTopics(text),
          riskLevel: sentiment.sentiment === 'negative' ? 'high' : sentiment.sentiment === 'positive' ? 'low' : 'medium',
        })
      }
    })

    // Process WhatsApp conversations
    whatsappConversations.forEach(conv => {
      const messages = conv.messages as any
      if (messages && Array.isArray(messages)) {
        const allText = messages.map((m: any) => m.text || m.body || '').join(' ')
        if (allText.trim()) {
          const sentiment = analyzeSentiment(allText)
          sentimentScores.push(sentiment.score)
          
          allConversations.push({
            contactId: conv.contactId || '',
            contactName: 'Unknown', // WhatsApp might not have contact name
            channel: 'whatsapp',
            sentiment: sentiment.sentiment,
            sentimentScore: sentiment.score,
            lastInteraction: conv.startedAt.toISOString(),
            interactionCount: messages.length,
            averageResponseTime: 0,
            topics: extractTopics(allText),
            riskLevel: sentiment.sentiment === 'negative' ? 'high' : sentiment.sentiment === 'positive' ? 'low' : 'medium',
          })
        }
      }
    })

    // Process SMS
    smsReports.forEach(sms => {
      if (sms.message) {
        const sentiment = analyzeSentiment(sms.message)
        sentimentScores.push(sentiment.score)
        
        allConversations.push({
          contactId: sms.contactId || '',
          contactName: 'Unknown',
          channel: 'sms',
          sentiment: sentiment.sentiment,
          sentimentScore: sentiment.score,
          lastInteraction: sms.sentAt?.toISOString() || new Date().toISOString(),
          interactionCount: 1,
          averageResponseTime: 0,
          topics: extractTopics(sms.message),
          riskLevel: sentiment.sentiment === 'negative' ? 'high' : sentiment.sentiment === 'positive' ? 'low' : 'medium',
        })
      }
    })

    // Aggregate metrics
    const metrics: ConversationMetrics = {
      totalConversations: allConversations.length,
      averageSentiment: sentimentScores.length > 0
        ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length
        : 50,
      positiveSentiment: allConversations.filter(c => c.sentiment === 'positive').length,
      neutralSentiment: allConversations.filter(c => c.sentiment === 'neutral').length,
      negativeSentiment: allConversations.filter(c => c.sentiment === 'negative').length,
      averageResponseTime: 0, // Can be calculated with actual response time data
      totalDuration: 0, // Can be calculated for calls
      channels: {
        email: allConversations.filter(c => c.channel === 'email').length,
        whatsapp: allConversations.filter(c => c.channel === 'whatsapp').length,
        sms: allConversations.filter(c => c.channel === 'sms').length,
        call: 0, // Can be added when call data is available
      },
    }

    // Group by contact for insights
    const contactInsights = new Map<string, ConversationInsight>()
    allConversations.forEach(conv => {
      const existing = contactInsights.get(conv.contactId)
      if (existing) {
        existing.interactionCount += conv.interactionCount
        existing.sentimentScore = (existing.sentimentScore + conv.sentimentScore) / 2
        if (new Date(conv.lastInteraction) > new Date(existing.lastInteraction)) {
          existing.lastInteraction = conv.lastInteraction
        }
        // Update sentiment to worst case
        if (conv.sentiment === 'negative') {
          existing.sentiment = 'negative'
          existing.riskLevel = 'high'
        } else if (conv.sentiment === 'neutral' && existing.sentiment === 'positive') {
          existing.sentiment = 'neutral'
          existing.riskLevel = 'medium'
        }
      } else {
        contactInsights.set(conv.contactId, { ...conv })
      }
    })

    return NextResponse.json({
      metrics,
      insights: Array.from(contactInsights.values()).sort((a, b) => {
        // Sort by risk level and sentiment score
        const riskOrder = { high: 0, medium: 1, low: 2 }
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
        }
        return a.sentimentScore - b.sentimentScore
      }),
      conversations: allConversations.slice(0, 100), // Return recent conversations
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Conversation intelligence error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation intelligence', message: error?.message },
      { status: 500 }
    )
  }
}

// Helper function to extract topics (simplified)
function extractTopics(text: string): string[] {
  const topics: string[] = []
  const lowerText = text.toLowerCase()
  
  // Simple keyword-based topic extraction
  const topicKeywords: Record<string, string[]> = {
    'pricing': ['price', 'cost', 'pricing', 'quote', 'budget'],
    'support': ['help', 'support', 'issue', 'problem', 'bug'],
    'product': ['product', 'feature', 'functionality', 'capability'],
    'billing': ['invoice', 'payment', 'billing', 'charge', 'subscription'],
    'onboarding': ['setup', 'onboarding', 'getting started', 'tutorial'],
  }
  
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      topics.push(topic)
    }
  })
  
  return topics.slice(0, 3) // Limit to 3 topics
}
