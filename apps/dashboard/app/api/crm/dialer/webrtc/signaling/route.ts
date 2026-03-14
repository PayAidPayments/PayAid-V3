import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// WebRTC Signaling endpoint for power dialer
// This handles WebRTC offer/answer exchange for browser-to-browser calls
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const { type, sdp, callId } = body

    // WebRTC signaling - forward offer/answer between peers
    // In a full implementation, this would use WebSocket for real-time signaling
    // For now, return the signaling data to be used by the frontend

    if (type === 'offer' || type === 'answer') {
      return NextResponse.json({
        success: true,
        type,
        sdp,
        callId,
        message: 'WebRTC signaling data received. Frontend will handle peer connection.',
        note: 'For production, implement WebSocket-based signaling server for real-time exchange.',
      })
    }

    return NextResponse.json(
      { error: 'Invalid signaling type. Expected "offer" or "answer".' },
      { status: 400 }
    )
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('WebRTC signaling error:', error)
    return NextResponse.json(
      { error: 'Failed to process signaling', message: error?.message },
      { status: 500 }
    )
  }
}
