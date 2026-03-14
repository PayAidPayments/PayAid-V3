import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const chatMessageSchema = z.object({
  message: z.string().min(1),
  visitorId: z.string().optional(),
  sessionId: z.string().optional(),
})

// POST /api/chatbots/[id]/chat - Handle chatbot conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Handle Next.js 16+ async params
    const resolvedParams = await params
    const body = await request.json()
    const validated = chatMessageSchema.parse(body)

    const chatbot = await prisma.websiteChatbot.findUnique({
      where: { id: resolvedParams.id },
      include: {
        website: true,
      },
    })

    if (!chatbot || !chatbot.isActive) {
      return NextResponse.json(
        { error: 'Chatbot not found or inactive' },
        { status: 404 }
      )
    }

    // Get or create conversation
    const sessionId = validated.sessionId || generateSessionId()
    const visitorId = validated.visitorId || generateVisitorId()

    let conversation = await prisma.chatbotConversation.findFirst({
      where: {
        chatbotId: resolvedParams.id,
        sessionId,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!conversation) {
      conversation = await prisma.chatbotConversation.create({
        data: {
          chatbotId: resolvedParams.id,
          visitorId,
          sessionId,
          messages: [],
          messageCount: 0,
          tenantId: chatbot.tenantId,
        },
      })
    }

    // Get messages
    const messages = (conversation.messages as any[]) || []
    const newMessage = {
      role: 'user',
      content: validated.message,
      timestamp: new Date().toISOString(),
    }
    messages.push(newMessage)

    // Generate AI response
    let aiResponse = 'I apologize, but I need more information to help you. Could you please provide more details?'

    // First, check FAQ knowledge base for quick answers
    if (chatbot.faqEnabled && chatbot.knowledgeBase) {
      const kb = chatbot.knowledgeBase as Record<string, string>
      const userMessage = validated.message.toLowerCase()

      // Simple keyword matching
      for (const [question, answer] of Object.entries(kb)) {
        if (userMessage.includes(question.toLowerCase()) || 
            question.toLowerCase().includes(userMessage)) {
          aiResponse = answer
          break
        }
      }
    }

    // If no FAQ match, use AI to generate response
    if (aiResponse === 'I apologize, but I need more information to help you. Could you please provide more details?') {
      try {
        // Build context from knowledge base
        const context = chatbot.knowledgeBase 
          ? `Knowledge Base:\n${JSON.stringify(chatbot.knowledgeBase, null, 2)}\n\n`
          : ''

        // Build system prompt
        const systemPrompt = `You are a helpful customer service chatbot for ${chatbot.website?.name || 'this business'}.
${context}
Be friendly, concise, and helpful. If you don't know the answer, politely ask for more information or offer to connect them with a human agent.`

        // Try AI providers in order: Groq -> Ollama -> Hugging Face
        try {
          const { getGroqClient } = await import('@/lib/ai/groq')
          const groq = getGroqClient()
          
          // Build message history with proper types
          const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
            { role: 'system', content: systemPrompt },
          ]
          
          // Add recent message history
          for (const m of messages.slice(-5)) {
            const role = m.role === 'user' ? 'user' as const : 'assistant' as const
            chatMessages.push({ role, content: m.content })
          }
          
          // Add current user message
          chatMessages.push({ role: 'user', content: validated.message })
          
          const response = await groq.chat(chatMessages)
          aiResponse = response.message || aiResponse
        } catch (groqError) {
          console.error('Groq error, trying Ollama:', groqError)
          try {
            const { getOllamaClient } = await import('@/lib/ai/ollama')
            const ollama = getOllamaClient()
            
            // Build message history with proper types
            const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
              { role: 'system', content: systemPrompt },
            ]
            
            // Add recent message history
            for (const m of messages.slice(-5)) {
              const role = m.role === 'user' ? 'user' as const : 'assistant' as const
              chatMessages.push({ role, content: m.content })
            }
            
            // Add current user message
            chatMessages.push({ role: 'user', content: validated.message })
            
            const response = await ollama.chat(chatMessages)
            aiResponse = response.message || aiResponse
          } catch (ollamaError) {
            console.error('Ollama error:', ollamaError)
            // Keep default response if all AI providers fail
          }
        }
      } catch (aiError) {
        console.error('AI response generation error:', aiError)
        // Keep default response if AI fails
      }
    }

    const botMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    }
    messages.push(botMessage)

    // Update conversation
    await prisma.chatbotConversation.update({
      where: { id: conversation.id },
      data: {
        messages,
        messageCount: messages.length,
        endedAt: null,
      },
    })

    // Check if lead should be qualified and create contact/deal
    let contactId: string | undefined
    let leadId: string | undefined

    if (chatbot.leadQualification && messages.length >= 3) {
      // Extract email/phone/name from conversation
      const emailMatch = validated.message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i)
      const phoneMatch = validated.message.match(/\b\d{10}\b/)
      
      // Try to extract name (simple pattern: "I'm John" or "My name is John")
      const namePatterns = [
        /(?:i'?m|i am|my name is|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:here|speaking)/i,
      ]
      let nameMatch: string | null = null
      for (const pattern of namePatterns) {
        const match = validated.message.match(pattern)
        if (match) {
          nameMatch = match[1]
          break
        }
      }

      // Extract company name if mentioned
      const companyPatterns = [
        /(?:from|at|works? at|company is)\s+([A-Z][A-Za-z0-9\s&]+)/i,
      ]
      let companyMatch: string | null = null
      for (const pattern of companyPatterns) {
        const match = validated.message.match(pattern)
        if (match) {
          companyMatch = match[1].trim()
          break
        }
      }

      // Check if we already have a contact for this visitor
      const existingContact = conversation.contactId
        ? await prisma.contact.findUnique({
            where: { id: conversation.contactId },
          })
        : null

      if (!existingContact && (emailMatch || phoneMatch || nameMatch)) {
        try {
          // Create contact in CRM
          const contact = await prisma.contact.create({
            data: {
              tenantId: chatbot.tenantId,
              name: nameMatch || 'Website Visitor',
              email: emailMatch ? emailMatch[0] : undefined,
              phone: phoneMatch ? phoneMatch[0] : undefined,
              company: companyMatch || undefined,
              type: 'lead',
              source: 'website',
              sourceData: {
                chatbotId: chatbot.id,
                sessionId,
                visitorId,
                website: chatbot.website?.domain || chatbot.website?.subdomain || undefined,
              } as any,
              attributionChannel: 'organic',
            },
          })

          contactId = contact.id

          // Update conversation with contact ID
          await prisma.chatbotConversation.update({
            where: { id: conversation.id },
            data: {
              contactId: contact.id,
              qualified: true,
            },
          })

          // Create a deal if the conversation indicates interest
          const interestKeywords = [
            'interested', 'pricing', 'price', 'cost', 'buy', 'purchase',
            'demo', 'trial', 'sign up', 'subscribe', 'service', 'product',
          ]
          const hasInterest = interestKeywords.some((keyword) =>
            validated.message.toLowerCase().includes(keyword)
          )

          if (hasInterest) {
            const deal = await prisma.deal.create({
              data: {
                tenantId: chatbot.tenantId,
                name: `Lead from ${chatbot.website?.domain || chatbot.website?.subdomain || 'Website'}`,
                value: 0, // Unknown value initially
                probability: 20, // Low initial probability
                stage: 'lead',
                contactId: contact.id,
              },
            })

            leadId = deal.id

            // Update conversation with deal ID
            await prisma.chatbotConversation.update({
              where: { id: conversation.id },
              data: {
                leadId: deal.id,
              },
            })
          }
        } catch (error) {
          console.error('Error creating contact/deal from chatbot:', error)
          // Don't fail the chat response if contact creation fails
        }
      } else if (existingContact) {
        contactId = existingContact.id
      }
    }

    return NextResponse.json({
      response: aiResponse,
      sessionId,
      visitorId,
      contactId,
      leadId,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Chatbot chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateVisitorId(): string {
  return `visitor_${Math.random().toString(36).substr(2, 16)}`
}
