/**
 * Email Tracking Injector
 * Injects tracking pixels and tracked links into email HTML
 */

import { createTrackingPixelUrl } from './tracking-pixel'
import { injectTrackingLinks } from './link-tracker'

/**
 * Inject tracking into email HTML
 */
export function injectEmailTracking(
  htmlBody: string,
  messageId: string,
  contactId?: string
): string {
  if (!htmlBody) return htmlBody

  let trackedHtml = htmlBody

  // Inject tracking links
  trackedHtml = injectTrackingLinks(trackedHtml, messageId, contactId)

  // Inject tracking pixel at the end of the body
  const trackingPixelUrl = createTrackingPixelUrl(messageId, contactId)
  const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`

  // Try to inject before closing </body> tag
  if (trackedHtml.includes('</body>')) {
    trackedHtml = trackedHtml.replace('</body>', `${trackingPixel}</body>`)
  } else {
    // If no body tag, append at the end
    trackedHtml = trackedHtml + trackingPixel
  }

  return trackedHtml
}

/**
 * Inject tracking into plain text email (convert to HTML)
 */
export function injectTrackingIntoPlainText(
  textBody: string,
  messageId: string,
  contactId?: string
): string {
  if (!textBody) return textBody

  // Convert plain text to HTML
  const htmlBody = textBody
    .split('\n')
    .map((line) => {
      // Convert URLs to links
      const urlRegex = /(https?:\/\/[^\s]+)/g
      return line.replace(urlRegex, (url) => {
        const trackedUrl = injectTrackingLinks(`<a href="${url}">${url}</a>`, messageId, contactId)
        return trackedUrl
      })
    })
    .join('<br>\n')

  // Add tracking pixel
  return injectEmailTracking(htmlBody, messageId, contactId)
}
