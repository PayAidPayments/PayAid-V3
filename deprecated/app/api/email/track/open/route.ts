/**
 * Email Open Tracking Endpoint
 * GET /api/email/track/open?token=xxx&msg=messageId
 * Returns 1x1 transparent PNG pixel to track email opens
 */

import { NextRequest, NextResponse } from 'next/server'
import { recordEmailOpen, generateTrackingPixel } from '@/lib/email/tracking-pixel'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const messageId = searchParams.get('msg')

    if (!messageId) {
      // Return pixel even if messageId missing (to avoid breaking email)
      const pixel = generateTrackingPixel()
      return new NextResponse(Buffer.from(pixel, 'base64'), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    }

    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Record the open event (async, don't wait)
    recordEmailOpen(token || '', messageId, {
      ip: ip.split(',')[0].trim(), // Get first IP if multiple
      userAgent,
    }).catch((error) => {
      console.error('Error recording email open:', error)
      // Don't throw - tracking failures shouldn't break the pixel
    })

    // Return 1x1 transparent PNG pixel immediately
    const pixel = generateTrackingPixel()
    return new NextResponse(Buffer.from(pixel, 'base64'), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Email open tracking error:', error)
    // Always return pixel even on error
    const pixel = generateTrackingPixel()
    return new NextResponse(Buffer.from(pixel, 'base64'), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
}
