/**
 * Twilio Connect Status Callback
 * Handles connection status updates from Twilio Media Streams
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid')?.toString();
    const streamStatus = formData.get('StreamStatus')?.toString();

    console.log('[Twilio Connect Status]', {
      callSid,
      streamStatus,
      timestamp: new Date().toISOString()
    });

    // Update call status when stream connects
    if (callSid && streamStatus === 'started') {
      await prisma.voiceAgentCall.updateMany({
        where: { callSid },
        data: {
          status: 'in-progress'
        }
      });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[Twilio Connect Status] Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
