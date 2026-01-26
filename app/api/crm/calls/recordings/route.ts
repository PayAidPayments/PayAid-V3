import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { handleTwilioRecording, handleExotelRecording } from '@/lib/telephony/call-recording'
import { z } from 'zod'

const TwilioRecordingSchema = z.object({
  RecordingSid: z.string(),
  CallSid: z.string(),
  RecordingUrl: z.string().url(),
})

const ExotelRecordingSchema = z.object({
  recording_id: z.string(),
  call_id: z.string(),
  recording_url: z.string().url(),
})

/**
 * POST /api/crm/calls/recordings
 * Webhook endpoint for call recording notifications (Twilio/Exotel)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const provider = request.headers.get('x-provider') || 'twilio'

    if (provider === 'twilio') {
      const data = TwilioRecordingSchema.parse(body)
      const tenantId = request.headers.get('x-tenant-id') || ''

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant ID required' },
          { status: 400 }
        )
      }

      await handleTwilioRecording(
        data.RecordingSid,
        data.CallSid,
        data.RecordingUrl,
        tenantId
      )

      return NextResponse.json({ success: true })
    } else if (provider === 'exotel') {
      const data = ExotelRecordingSchema.parse(body)
      const tenantId = request.headers.get('x-tenant-id') || ''

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant ID required' },
          { status: 400 }
        )
      }

      await handleExotelRecording(
        data.recording_id,
        data.call_id,
        data.recording_url,
        tenantId
      )

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error handling call recording:', error)
    return NextResponse.json(
      { error: 'Failed to process recording' },
      { status: 500 }
    )
  }
}
