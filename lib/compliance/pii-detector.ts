/**
 * PII (Personally Identifiable Information) Detector
 * Detects and masks sensitive data for compliance
 */

export interface PIIDetectionResult {
  detected: boolean
  type: 'email' | 'phone' | 'pan' | 'credit_card' | 'aadhaar' | 'ssn' | null
  original: string
  masked: string
  confidence: number // 0-1
}

// PII Detection Patterns
const PII_PATTERNS = {
  email: /([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  phone: {
    indian: /(\+91[\s-]?)?[6-9]\d{9}/g, // Indian mobile numbers
    international: /\+?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,9}/g,
  },
  pan: /[A-Z]{5}[0-9]{4}[A-Z]{1}/g, // Indian PAN
  creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
  aadhaar: /\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, // Indian Aadhaar
  ssn: /\d{3}-\d{2}-\d{4}/g, // US SSN
}

/**
 * Detect PII in text
 */
export function detectPII(text: string): PIIDetectionResult[] {
  const results: PIIDetectionResult[] = []

  // Check email
  const emailMatches = text.matchAll(PII_PATTERNS.email)
  for (const match of emailMatches) {
    results.push({
      detected: true,
      type: 'email',
      original: match[0],
      masked: maskEmail(match[0]),
      confidence: 1.0,
    })
  }

  // Check phone (Indian)
  const phoneMatches = text.matchAll(PII_PATTERNS.phone.indian)
  for (const match of phoneMatches) {
    results.push({
      detected: true,
      type: 'phone',
      original: match[0],
      masked: maskPhone(match[0]),
      confidence: 0.95,
    })
  }

  // Check PAN
  const panMatches = text.matchAll(PII_PATTERNS.pan)
  for (const match of panMatches) {
    results.push({
      detected: true,
      type: 'pan',
      original: match[0],
      masked: maskPAN(match[0]),
      confidence: 1.0,
    })
  }

  // Check credit card
  const cardMatches = text.matchAll(PII_PATTERNS.creditCard)
  for (const match of cardMatches) {
    // Validate Luhn algorithm (basic check)
    const cardNumber = match[0].replace(/[\s-]/g, '')
    if (isValidCreditCard(cardNumber)) {
      results.push({
        detected: true,
        type: 'credit_card',
        original: match[0],
        masked: maskCreditCard(match[0]),
        confidence: 0.9,
      })
    }
  }

  // Check Aadhaar
  const aadhaarMatches = text.matchAll(PII_PATTERNS.aadhaar)
  for (const match of aadhaarMatches) {
    results.push({
      detected: true,
      type: 'aadhaar',
      original: match[0],
      masked: maskAadhaar(match[0]),
      confidence: 0.9,
    })
  }

  // Check SSN
  const ssnMatches = text.matchAll(PII_PATTERNS.ssn)
  for (const match of ssnMatches) {
    results.push({
      detected: true,
      type: 'ssn',
      original: match[0],
      masked: maskSSN(match[0]),
      confidence: 1.0,
    })
  }

  return results
}

/**
 * Mask email: user@*** or first.last@***
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!domain) return email

  const maskedLocal = localPart.length > 2
    ? `${localPart.substring(0, 2)}***`
    : '***'
  return `${maskedLocal}@***.***`
}

/**
 * Mask phone: ****1234
 */
function maskPhone(phone: string): string {
  const digits = phone.replace(/[\s-+]/g, '')
  if (digits.length < 4) return phone
  return `****${digits.slice(-4)}`
}

/**
 * Mask PAN: ***11111A
 */
function maskPAN(pan: string): string {
  if (pan.length !== 10) return pan
  return `***${pan.slice(-5)}`
}

/**
 * Mask credit card: ****1234
 */
function maskCreditCard(card: string): string {
  const digits = card.replace(/[\s-]/g, '')
  if (digits.length < 4) return card
  return `****${digits.slice(-4)}`
}

/**
 * Mask Aadhaar: ****1234
 */
function maskAadhaar(aadhaar: string): string {
  const digits = aadhaar.replace(/[\s-]/g, '')
  if (digits.length < 4) return aadhaar
  return `****${digits.slice(-4)}`
}

/**
 * Mask SSN: ***-**-1234
 */
function maskSSN(ssn: string): string {
  const parts = ssn.split('-')
  if (parts.length !== 3) return ssn
  return `***-**-${parts[2]}`
}

/**
 * Validate credit card using Luhn algorithm
 */
function isValidCreditCard(cardNumber: string): boolean {
  if (cardNumber.length < 13 || cardNumber.length > 19) return false

  let sum = 0
  let isEven = false

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * Mask all PII in text
 */
export function maskPIIInText(text: string): string {
  const detections = detectPII(text)
  let maskedText = text

  // Replace in reverse order to preserve indices
  detections
    .sort((a, b) => text.indexOf(b.original) - text.indexOf(a.original))
    .forEach((detection) => {
      maskedText = maskedText.replace(detection.original, detection.masked)
    })

  return maskedText
}

/**
 * Check if text contains any PII
 */
export function containsPII(text: string): boolean {
  return detectPII(text).length > 0
}
