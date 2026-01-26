/**
 * Email Tracking Pixel Generator
 * Generates 1x1 transparent pixel images for email open tracking
 */

import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

/**
 * Generate a unique tracking token for an email message
 */
export function generateTrackingToken(messageId: string, contactId?: string): string {
  const data = `${messageId}:${contactId || 'unknown'}:${Date.now()}`
  const hash = crypto.createHash('sha256').update(data).digest('hex')
  return hash.substring(0, 32) // 32 character token
}

/**
 * Create tracking pixel URL
 */
export function createTrackingPixelUrl(
  messageId: string,
  contactId?: string,
  baseUrl?: string
): string {
  const token = generateTrackingToken(messageId, contactId)
  const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${appUrl}/api/email/track/open?token=${token}&msg=${messageId}`
}

/**
 * Generate 1x1 transparent PNG pixel
 * Returns base64 encoded PNG image
 */
export function generateTrackingPixel(): string {
  // 1x1 transparent PNG in base64
  // This is the smallest possible transparent PNG
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
}

/**
 * Record email open event
 */
export async function recordEmailOpen(
  token: string,
  messageId: string,
  request?: {
    ip?: string
    userAgent?: string
  }
): Promise<void> {
  try {
    // Find email message
    const emailMessage = await prisma.emailMessage.findUnique({
      where: { id: messageId },
      include: {
        account: {
          select: { tenantId: true },
        },
      },
    })

    if (!emailMessage) {
      console.error(`Email message not found: ${messageId}`)
      return
    }

    // Store tracking data in message's searchText field as JSON (temporary solution)
    // In production, you'd want a separate EmailTracking model
    const trackingData = {
      opens: (emailMessage.searchText ? JSON.parse(emailMessage.searchText).opens || [] : []) as Array<{ timestamp: string; ip?: string; userAgent?: string }>,
    }

    // Check if already opened today (prevent duplicate tracking per day)
    const today = new Date().toISOString().split('T')[0]
    const openedToday = trackingData.opens.some(
      (open) => open.timestamp.startsWith(today)
    )

    if (!openedToday) {
      // Add new open event
      trackingData.opens.push({
        timestamp: new Date().toISOString(),
        ip: request?.ip || undefined,
        userAgent: request?.userAgent || undefined,
      })

      // Update email message with tracking data
      await prisma.emailMessage.update({
        where: { id: messageId },
        data: {
          searchText: JSON.stringify(trackingData),
          isRead: true, // Mark as read when opened
        },
      })
    }

    // Update contact engagement if linked
    if (emailMessage.contactId) {
      await prisma.contact.update({
        where: { id: emailMessage.contactId },
        data: {
          lastContactedAt: new Date(),
        },
      })
    }
  } catch (error) {
    console.error('Error recording email open:', error)
    // Don't throw - tracking failures shouldn't break the app
  }
}
