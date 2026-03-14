import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * SendGrid Webhook Handler for Email Bounces
 * POST /api/email/bounces/webhook
 * 
 * SendGrid sends bounce events to this endpoint
 * Documentation: https://docs.sendgrid.com/for-developers/tracking-events/event
 */
export async function POST(request: NextRequest) {
  try {
    const events = await request.json()

    // SendGrid sends an array of events
    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    const bouncePromises = events
      .filter((event) => {
        // Filter for bounce-related events
        return ['bounce', 'dropped', 'blocked', 'spamreport', 'unsubscribe'].includes(event.event)
      })
      .map(async (event) => {
        const emailAddress = event.email
        const tenantId = extractTenantIdFromEmail(event.email) // Extract from email or custom field

        if (!tenantId || !emailAddress) {
          return null
        }

        // Determine bounce type
        let bounceType = 'soft'
        let bounceCategory = event.event

        if (event.event === 'bounce') {
          bounceType = event.type === 'hard' ? 'hard' : 'soft'
          bounceCategory = event.reason || 'bounce'
        } else if (event.event === 'dropped') {
          bounceType = 'hard'
          bounceCategory = event.reason || 'dropped'
        } else if (event.event === 'blocked') {
          bounceType = 'hard'
          bounceCategory = 'blocked'
        } else if (event.event === 'spamreport') {
          bounceType = 'hard'
          bounceCategory = 'spam'
        } else if (event.event === 'unsubscribe') {
          bounceType = 'hard'
          bounceCategory = 'unsubscribed'
        }

        // Create or update bounce record
        const bounce = await prisma.emailBounce.upsert({
          where: {
            tenantId_emailAddress: {
              tenantId,
              emailAddress,
            },
          },
          update: {
            bounceType,
            bounceReason: event.reason || event.event,
            bounceCategory,
            isSuppressed: true,
            suppressedAt: new Date(),
          },
          create: {
            tenantId,
            emailAddress,
            bounceType,
            bounceReason: event.reason || event.event,
            bounceCategory,
            campaignId: event.campaign_id || null,
            messageId: event.sg_message_id || null,
            isSuppressed: true,
            suppressedAt: new Date(),
          },
        })

        return bounce
      })

    await Promise.all(bouncePromises.filter(Boolean))

    return NextResponse.json({ success: true, processed: events.length })
  } catch (error) {
    console.error('Email bounce webhook error:', error)
    // Always return 200 to prevent SendGrid from retrying
    return NextResponse.json({ success: false, error: 'Processing failed' }, { status: 200 })
  }
}

/**
 * Extract tenant ID from email address or custom field
 * This is a helper - you may need to adjust based on your email structure
 */
function extractTenantIdFromEmail(email: string): string | null {
  // Option 1: Extract from email domain/subdomain
  // Option 2: Use SendGrid custom fields (if configured)
  // Option 3: Look up tenant by email domain
  
  // For now, return null - you'll need to implement based on your setup
  // You might want to store tenantId in SendGrid custom fields when sending emails
  return null
}

/**
 * GET /api/email/bounces/webhook - Verify webhook (for SendGrid verification)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Email bounce webhook endpoint' })
}

