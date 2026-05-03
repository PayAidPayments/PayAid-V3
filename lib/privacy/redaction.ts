const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE_REGEX = /\b(?:\+?\d{1,3}[- ]?)?\d{10}\b/g
const GSTIN_REGEX = /\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9]\b/gi

function redactString(input: string): string {
  return input
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]')
    .replace(GSTIN_REGEX, '[REDACTED_GSTIN]')
}

export function redactPII<T>(value: T): T {
  if (typeof value === 'string') {
    return redactString(value) as T
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactPII(item)) as T
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.includes('email') ||
        lowerKey.includes('phone') ||
        lowerKey.includes('mobile') ||
        lowerKey.includes('gstin')
      ) {
        output[key] = '[REDACTED]'
      } else {
        output[key] = redactPII(item)
      }
    }
    return output as T
  }

  return value
}
