/**
 * Input Sanitization Service
 * Zero-cost enhancement for security
 */

/**
 * IMPORTANT:
 * Avoid DOMPurify/jsdom on the server in Vercel serverless runtime because recent jsdom versions
 * require a newer Node minor and pull ESM-only deps that can crash production ("require() of ES Module").
 *
 * Instead, we enforce a strict policy: store/render plain text by default.
 * If rich-text HTML is needed later, we should reintroduce a server-safe sanitizer with a vetted dependency.
 */

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  // Strip all tags; keep just text.
  // This prevents stored XSS and avoids server-side DOM dependencies.
  return String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/**
 * Sanitize user input (remove potentially dangerous characters)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const sanitized = email.trim().toLowerCase()
  return emailRegex.test(sanitized) ? sanitized : null
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj }
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key])
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key])
    }
  }
  return sanitized
}
