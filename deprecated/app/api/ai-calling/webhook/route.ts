import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import {
  handleIncomingCall,
  recognizeIntent,
  textToSpeech,
  speechToText,
  shouldEscalate,
  createContactFromCall,
} from '@/lib/ai-calling/twilio-handler'

/**
 * Twilio Webhook Handler
 * POST /api/ai-calling/webhook - Handle Twilio call events
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get('CallSid') as string
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const callStatus = formData.get('CallStatus') as string
    const speechResult = formData.get('SpeechResult') as string | null

    // Find bot by phone number
    const bot = await prisma.aICallingBot.findFirst({
      where: { phoneNumber: to },
      include: { tenant: true },
    })

    if (!bot || !bot.isActive) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, this service is not available.</Say></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // Handle different call statuses
    if (callStatus === 'ringing' || callStatus === 'in-progress') {
      // Initial call - play greeting
      const greeting = bot.greeting || 'Hello! Thank you for calling. How can I help you today?'
      
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">${greeting}</Say>
          <Gather input="speech" action="/api/ai-calling/webhook" method="POST" speechTimeout="auto">
            <Say voice="alice">Please speak your question or request.</Say>
          </Gather>
          <Say voice="alice">I didn't catch that. Please call again.</Say>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // Handle speech input
    if (speechResult) {
      // Recognize intent
      const intentResult = await recognizeIntent(
        speechResult,
        (bot.faqKnowledgeBase as Array<{ question: string; answer: string }>) || []
      )

      // Check if escalation needed
      if (shouldEscalate(intentResult, 0)) {
        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">Let me transfer you to a human agent. Please hold.</Say>
            <Dial>+1234567890</Dial>
          </Response>`,
          { headers: { 'Content-Type': 'text/xml' } }
        )
      }

      // Generate response
      const response = intentResult.response

      // Create contact from call
      await createContactFromCall(from, {
        duration: 0,
        transcript: speechResult,
        intent: intentResult.intent,
      })

      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">${response}</Say>
          <Gather input="speech" action="/api/ai-calling/webhook" method="POST" speechTimeout="auto">
            <Say voice="alice">Is there anything else I can help you with?</Say>
          </Gather>
          <Say voice="alice">Thank you for calling. Have a great day!</Say>
          <Hangup/>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    // Default response
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for calling. Goodbye.</Say></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  } catch (error) {
    console.error('AI calling webhook error:', error)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, an error occurred. Please try again later.</Say></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }
}

