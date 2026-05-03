/**
 * Email Signature Templates
 * Manages email signatures with automatic tracking code injection
 */

import { prisma } from '@/lib/db/prisma'
import { createTrackingPixelUrl } from './tracking-pixel'

export interface SignatureTemplate {
  id?: string
  name: string
  htmlContent: string
  textContent?: string
  isDefault?: boolean
  userId?: string
  tenantId: string
}

/**
 * Get user's default email signature
 */
export async function getUserSignature(
  tenantId: string,
  userId: string
): Promise<SignatureTemplate | null> {
  try {
    // Check if user has a custom signature in settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        tenantId: true,
      },
    })

    if (!user || user.tenantId !== tenantId) {
      return null
    }

    // For now, generate a default signature
    // In production, you'd store this in User.settings or a separate table
    return {
      name: 'Default Signature',
      htmlContent: generateDefaultSignature(user.name || user.email, user.email),
      textContent: generateDefaultSignatureText(user.name || user.email, user.email),
      isDefault: true,
      tenantId,
      userId,
    }
  } catch (error) {
    console.error('Error getting user signature:', error)
    return null
  }
}

/**
 * Generate default HTML signature with tracking
 */
export function generateDefaultSignature(
  name: string,
  email: string,
  options?: {
    phone?: string
    company?: string
    title?: string
    trackingPixelUrl?: string
  }
): string {
  const trackingPixel = options?.trackingPixelUrl
    ? `<img src="${options.trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`
    : ''

  return `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
      <div style="margin-bottom: 8px;">
        <strong>${escapeHtml(name)}</strong>
      </div>
      ${options?.title ? `<div style="margin-bottom: 4px; color: #666;">${escapeHtml(options.title)}</div>` : ''}
      ${options?.company ? `<div style="margin-bottom: 4px; color: #666;">${escapeHtml(options.company)}</div>` : ''}
      <div style="margin-bottom: 4px;">
        📧 <a href="mailto:${escapeHtml(email)}" style="color: #0066cc; text-decoration: none;">${escapeHtml(email)}</a>
      </div>
      ${options?.phone ? `<div style="margin-bottom: 4px;">📞 ${escapeHtml(options.phone)}</div>` : ''}
      ${trackingPixel}
    </div>
  `.trim()
}

/**
 * Generate default text signature
 */
export function generateDefaultSignatureText(
  name: string,
  email: string,
  options?: {
    phone?: string
    company?: string
    title?: string
  }
): string {
  const lines = [
    name,
    options?.title || '',
    options?.company || '',
    `Email: ${email}`,
    options?.phone ? `Phone: ${options.phone}` : '',
  ].filter(Boolean)

  return lines.join('\n')
}

/**
 * Inject signature into email HTML
 */
export function injectSignature(
  htmlBody: string,
  signature: SignatureTemplate,
  messageId?: string,
  contactId?: string
): string {
  if (!htmlBody) {
    htmlBody = '<html><body></body></html>'
  }

  // Add tracking pixel to signature if messageId provided
  let signatureHtml = signature.htmlContent
  if (messageId) {
    const trackingPixelUrl = createTrackingPixelUrl(messageId, contactId)
    signatureHtml = signatureHtml.replace(
      '</div>',
      `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" /></div>`
    )
  }

  // Inject signature before closing </body> tag
  if (htmlBody.includes('</body>')) {
    return htmlBody.replace('</body>', `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">${signatureHtml}</div></body>`)
  } else {
    // If no body tag, wrap and add signature
    return `<html><body>${htmlBody}<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">${signatureHtml}</div></body></html>`
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Get signature template for tenant/user
 */
export async function getSignatureTemplate(
  tenantId: string,
  userId: string
): Promise<string> {
  const signature = await getUserSignature(tenantId, userId)
  return signature?.htmlContent || ''
}
