/**
 * Twilio inbound voice webhook signature validation (shared by apps/voice route).
 * Validates the inbound POST only; TwiML shape (<Gather> vs <Connect><Stream>) is unrelated.
 */
import { verifyTwilioSignature } from '@/lib/twilio-utils'

export const TWILIO_VOICE_INBOUND_WEBHOOK_PATH = '/api/v1/voice-agents/twilio/webhook'

/**
 * URL Twilio used when signing the request. Must match the Console webhook URL exactly
 * (including path, query string, and encoding). Prefer TWILIO_WEBHOOK_URL in production.
 */
export function resolveTwilioWebhookValidationUrl(
  requestOrigin?: string,
  env: NodeJS.ProcessEnv = process.env
): string {
  const configured = env.TWILIO_WEBHOOK_URL?.trim()
  if (configured) return configured
  const origin = (requestOrigin ?? '').replace(/\/$/, '')
  return `${origin}${TWILIO_VOICE_INBOUND_WEBHOOK_PATH}`
}

export function shouldVerifyTwilioWebhookSignature(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === 'production'
}

/** Returns false when production signature check fails; no-op outside production. */
export function verifyTwilioInboundWebhookSignature(opts: {
  validationUrl: string
  rawBody: string
  signatureHeader: string
  authToken: string
  env?: NodeJS.ProcessEnv
}): boolean {
  const env = opts.env ?? process.env
  if (!shouldVerifyTwilioWebhookSignature(env)) return true
  if (!opts.authToken?.trim()) return false
  return verifyTwilioSignature(
    opts.validationUrl,
    opts.rawBody,
    opts.signatureHeader,
    opts.authToken,
  )
}
