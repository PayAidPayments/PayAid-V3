/**
 * Email Click Tracking Endpoint
 * GET /api/email/track/click?token=xxx&msg=messageId&url=originalUrl
 * Redirects to original URL after tracking the click
 */

import { NextRequest, NextResponse } from 'next/server'
import { recordEmailClick } from '@/lib/email/link-tracker'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const messageId = searchParams.get('msg')
    const originalUrl = searchParams.get('url')

    if (!messageId || !originalUrl) {
      // Redirect to app home if missing params
      return NextResponse.redirect(
        new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', request.url)
      )
    }

    // Decode the original URL
    const decodedUrl = decodeURIComponent(originalUrl)

    // Validate URL
    let targetUrl: URL
    try {
      targetUrl = new URL(decodedUrl)
    } catch {
      // If invalid URL, redirect to app home
      return NextResponse.redirect(
        new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', request.url)
      )
    }

    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Record the click event (async, don't wait)
    recordEmailClick(token || '', messageId, decodedUrl, {
      ip: ip.split(',')[0].trim(), // Get first IP if multiple
      userAgent,
    }).catch((error) => {
      console.error('Error recording email click:', error)
      // Don't throw - tracking failures shouldn't break the redirect
    })

    // Redirect to original URL immediately
    return NextResponse.redirect(targetUrl.toString(), {
      status: 302,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Email click tracking error:', error)
    // Redirect to app home on error
    return NextResponse.redirect(
      new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', request.url)
    )
  }
}
