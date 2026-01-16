/**
 * Twilio Webhook Handler
 * Handles incoming call events from Twilio
 * 
 * Webhook URL: /api/v1/voice-agents/twilio/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/db/prisma';
import { verifyTwilioSignature, parseTwilioWebhook } from '@/lib/twilio-utils';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  try {
    // ===== VALIDATE TWILIO WEBHOOK =====
    const body = await request.text();
    const signature = request.headers.get('X-Twilio-Signature') || '';
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL || 
      `${request.nextUrl.origin}/api/v1/voice-agents/twilio/webhook`;
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';

    // Verify signature (skip in development for easier testing)
    if (process.env.NODE_ENV === 'production') {
      if (!verifyTwilioSignature(webhookUrl, body, signature, authToken)) {
        console.error('[Twilio Webhook] Invalid signature');
        return new NextResponse('Unauthorized', { status: 403 });
      }
    }

    // ===== PARSE TWILIO PARAMETERS =====
    const params = parseTwilioWebhook(body);
    const { callSid, from, to, callStatus } = params;

    console.log('[Twilio Webhook] Incoming Call:', {
      callSid,
      from,
      to,
      callStatus,
      timestamp: new Date().toISOString()
    });

    // ===== FIND AGENT BY PHONE NUMBER =====
    const agent = await prisma.voiceAgent.findUnique({
      where: { phoneNumber: to }
    });

    if (!agent) {
      console.error('[Twilio] Agent not found for number:', to);
      const twiml = new VoiceResponse();
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Sorry, this number is not configured. Please contact support.');
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Check if agent is active
    if (agent.status !== 'active') {
      console.error('[Twilio] Agent is not active:', agent.id);
      const twiml = new VoiceResponse();
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, 'Sorry, this service is currently unavailable.');
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // ===== CREATE CALL RECORD =====
    const call = await prisma.voiceAgentCall.create({
      data: {
        callSid,
        agentId: agent.id,
        tenantId: agent.tenantId,
        from,
        to,
        phone: from, // Legacy field
        inbound: true,
        status: 'ringing',
        startTime: new Date()
      }
    });

    console.log('[Twilio] Call record created:', call.id);

    // ===== GENERATE TWIML RESPONSE =====
    const twiml = new VoiceResponse();
    
    // Say greeting (first 200 chars of system prompt or custom greeting)
    const greeting = agent.description 
      ? `${agent.description.substring(0, 200)}`
      : `Hello, you've reached ${agent.name}. How can I help you?`;
    
    twiml.say({
      voice: agent.language === 'en' ? 'alice' : 'alice',
      language: agent.language === 'en' ? 'en-US' : agent.language
    }, greeting);

    // Connect to WebSocket stream for real-time audio
    const wsUrl = process.env.TELEPHONY_WEBSOCKET_URL || 
      `wss://${request.headers.get('host') || 'localhost:3002'}/voice/stream`;
    
    twiml.connect({
      action: `${request.nextUrl.origin}/api/v1/voice-agents/twilio/connect-status`,
      method: 'POST'
    }).stream({
      url: `${wsUrl}?callSid=${callSid}&agentId=${agent.id}`,
      track: 'inbound_track'
    });

    return new NextResponse(twiml.toString(), {
      headers: { 
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('[Twilio Webhook] Error:', error);
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Sorry, something went wrong. Please try again later.');
    return new NextResponse(twiml.toString(), {
      status: 500,
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}

// Handle GET requests (for Twilio status callbacks)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const callSid = searchParams.get('CallSid');
  const callStatus = searchParams.get('CallStatus');

  console.log('[Twilio Status] Call status update:', {
    callSid,
    callStatus,
    timestamp: new Date().toISOString()
  });

  // Update call record if exists
  if (callSid) {
    try {
      await prisma.voiceAgentCall.updateMany({
        where: { callSid },
        data: {
          status: callStatus === 'completed' ? 'completed' : 
                  callStatus === 'in-progress' ? 'in-progress' :
                  callStatus === 'failed' ? 'failed' : 'ringing',
          endTime: callStatus === 'completed' || callStatus === 'failed' 
            ? new Date() 
            : undefined
        }
      });
    } catch (error) {
      console.error('[Twilio Status] Error updating call:', error);
    }
  }

  return new NextResponse('OK', { status: 200 });
}
