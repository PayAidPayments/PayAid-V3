/**
 * Webhook authenticity helpers — Twilio signature validation for form POST callbacks.
 */

import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { verifyTwilioSignature } from '@/lib/twilio-utils'
import { resolveTwilioWebhookValidationUrl } from '@/lib/voice-agent/twilio-webhook-signature'

function formDataToSortedParams(formData: FormData): URLSearchParams {
  const params = new URLSearchParams()
  const keys = [...formData.keys()].sort()
  for (const key of keys) {
    const value = formData.get(key)
    if (value != null) params.append(key, String(value))
  }
  return params
}

function formDataToRecord(formData: FormData): Record<string, string> {
  const record: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') record[key] = value
  }
  return record
}

export function verifyTwilioFormWebhookSignature(
  request: NextRequest,
  formData: FormData,
  authToken: string,
  options?: { validationUrl?: string }
): boolean {
  if (!authToken?.trim()) return false
  const signature = request.headers.get('x-twilio-signature') || request.headers.get('X-Twilio-Signature') || ''
  if (!signature) return false

  const validationUrl = options?.validationUrl || request.url

  try {
    return twilio.validateRequest(authToken, signature, validationUrl, formDataToRecord(formData))
  } catch {
    const params = formDataToSortedParams(formData)
    return verifyTwilioSignature(validationUrl, params, signature, authToken)
  }
}

/**
 * Reject unauthenticated Twilio webhooks in production when auth token is configured.
 * Returns a 403 response when invalid; null when allowed.
 */
export function rejectInvalidTwilioWebhook(
  request: NextRequest,
  formData: FormData,
  authToken: string | undefined,
  options?: { validationUrl?: string; env?: NodeJS.ProcessEnv }
): NextResponse | null {
  const env = options?.env ?? process.env
  const token = authToken?.trim()
  if (!token) {
    if (env.NODE_ENV === 'production') return new NextResponse('Forbidden', { status: 403 })
    return null
  }

  if (env.NODE_ENV !== 'production') return null

  const validationUrl =
    options?.validationUrl ||
    resolveTwilioWebhookValidationUrl(request.nextUrl.origin, env)

  const valid = verifyTwilioFormWebhookSignature(request, formData, token, { validationUrl })
  if (!valid) return new NextResponse('Forbidden', { status: 403 })
  return null
}
