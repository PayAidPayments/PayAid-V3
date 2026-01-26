/**
 * Email Link Tracking Service
 * Tracks email link clicks by redirecting through tracking URL
 */

import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

/**
 * Generate a unique tracking token for a link
 */
export function generateLinkTrackingToken(
  messageId: string,
  originalUrl: string,
  contactId?: string
): string {
  const data = `${messageId}:${originalUrl}:${contactId || 'unknown'}:${Date.now()}`
  const hash = crypto.createHash('sha256').update(data).digest('hex')
  return hash.substring(0, 32) // 32 character token
}

/**
 * Create tracked link URL
 */
export function createTrackedLink(
  messageId: string,
  originalUrl: string,
  contactId?: string,
  baseUrl?: string
): string {
  const token = generateLinkTrackingToken(messageId, originalUrl, contactId)
  const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // Encode the original URL and token
  const encodedUrl = encodeURIComponent(originalUrl)
  return `${appUrl}/api/email/track/click?token=${token}&msg=${messageId}&url=${encodedUrl}`
}

/**
 * Process all links in email body and replace with tracked links
 */
export function injectTrackingLinks(
  htmlBody: string,
  messageId: string,
  contactId?: string
): string {
  if (!htmlBody) return htmlBody

  // Match all <a href="..."> tags
  const linkRegex = /<a\s+([^>]*\s+)?href=["']([^"']+)["']([^>]*)>/gi

  return htmlBody.replace(linkRegex, (match, before, url, after) => {
    // Skip if already a tracking link or mailto: link
    if (url.startsWith('mailto:') || url.includes('/api/email/track/click')) {
      return match
    }

    // Skip if it's an anchor link
    if (url.startsWith('#')) {
      return match
    }

    // Create tracked link
    const trackedUrl = createTrackedLink(messageId, url, contactId)
    return `<a ${before || ''}href="${trackedUrl}"${after}>`
  })
}

/**
 * Record email click event
 */
export async function recordEmailClick(
  token: string,
  messageId: string,
  originalUrl: string,
  request?: {
    ip?: string
    userAgent?: string
  }
): Promise<string> {
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
      return originalUrl // Return original URL if message not found
    }

    // Store tracking data in message's searchText field as JSON (temporary solution)
    // In production, you'd want a separate EmailTracking model
    const trackingData = emailMessage.searchText
      ? JSON.parse(emailMessage.searchText)
      : { opens: [], clicks: [] }

    if (!trackingData.clicks) {
      trackingData.clicks = []
    }

    // Add new click event
    trackingData.clicks.push({
      timestamp: new Date().toISOString(),
      url: originalUrl,
      ip: request?.ip || undefined,
      userAgent: request?.userAgent || undefined,
    })

    // Update email message with tracking data
    await prisma.emailMessage.update({
      where: { id: messageId },
      data: {
        searchText: JSON.stringify(trackingData),
        isRead: true, // Mark as read when clicked
      },
    })

    // Update contact engagement if linked
    if (emailMessage.contactId) {
      await prisma.contact.update({
        where: { id: emailMessage.contactId },
        data: {
          lastContactedAt: new Date(),
        },
      })
    }

    return originalUrl
  } catch (error) {
    console.error('Error recording email click:', error)
    // Return original URL even on error
    return originalUrl
  }
}
