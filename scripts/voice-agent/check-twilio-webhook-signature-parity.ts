/**
 * Twilio webhook signature parity (Stage 1). Same coverage as Jest suite; fast CI entrypoint.
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { verifyTwilioSignature, parseTwilioWebhook } from '../../lib/twilio-utils'
import {
  TWILIO_VOICE_INBOUND_WEBHOOK_PATH,
  resolveTwilioWebhookValidationUrl,
  shouldVerifyTwilioWebhookSignature,
  verifyTwilioInboundWebhookSignature,
} from '../../lib/voice-agent/twilio-webhook-signature'

const AUTH_TOKEN = 'test-twilio-auth-token-stage1'
const PRODUCTION_WEBHOOK_URL = 'https://payaid-v3.vercel.app/api/v1/voice-agents/twilio/webhook'
const INTERNAL_ORIGIN = 'https://payaid-v3-abc123.vercel.app'
const prodEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  TWILIO_WEBHOOK_URL: PRODUCTION_WEBHOOK_URL,
}

function sign(url: string, body: string, token: string): string {
  return crypto.createHmac('sha1', token).update(url + body, 'utf-8').digest('base64')
}

function buildInboundBody(overrides: Record<string, string> = {}): string {
  return new URLSearchParams({
    AccountSid: 'AC_test_account',
    ApiVersion: '2010-04-01',
    CallSid: 'CA_stage1_sig_parity',
    CallStatus: 'ringing',
    Called: '+911234567890',
    Caller: '+919876543210',
    Direction: 'inbound',
    From: '+919876543210',
    To: '+911234567890',
    ...overrides,
  }).toString()
}

const inboundBody = buildInboundBody()
let failed = 0

function assert(name: string, condition: boolean): void {
  if (!condition) {
    console.error(`FAIL: ${name}`)
    failed += 1
    return
  }
  console.log(`ok: ${name}`)
}

const validationUrl = resolveTwilioWebhookValidationUrl(INTERNAL_ORIGIN, prodEnv)
assert('TWILIO_WEBHOOK_URL overrides internal origin', validationUrl === PRODUCTION_WEBHOOK_URL)
assert(
  'fallback path when TWILIO_WEBHOOK_URL unset',
  resolveTwilioWebhookValidationUrl(INTERNAL_ORIGIN, { NODE_ENV: 'production', TWILIO_WEBHOOK_URL: '' }) ===
    `${INTERNAL_ORIGIN}${TWILIO_VOICE_INBOUND_WEBHOOK_PATH}`,
)

const validSig = sign(validationUrl, inboundBody, AUTH_TOKEN)
assert(
  'valid production URL + full body',
  verifyTwilioInboundWebhookSignature({
    validationUrl,
    rawBody: inboundBody,
    signatureHeader: validSig,
    authToken: AUTH_TOKEN,
    env: prodEnv,
  }),
)

const wrongOriginSig = sign(`${INTERNAL_ORIGIN}${TWILIO_VOICE_INBOUND_WEBHOOK_PATH}`, inboundBody, AUTH_TOKEN)
assert(
  'rejects signature signed with internal origin',
  !verifyTwilioInboundWebhookSignature({
    validationUrl,
    rawBody: inboundBody,
    signatureHeader: wrongOriginSig,
    authToken: AUTH_TOKEN,
    env: prodEnv,
  }),
)

assert(
  'rejects tampered body',
  !verifyTwilioInboundWebhookSignature({
    validationUrl,
    rawBody: `${inboundBody}&Foo=bar`,
    signatureHeader: validSig,
    authToken: AUTH_TOKEN,
    env: prodEnv,
  }),
)

assert(
  'rejects tampered validation URL',
  !verifyTwilioInboundWebhookSignature({
    validationUrl: 'https://evil.example/api/v1/voice-agents/twilio/webhook',
    rawBody: inboundBody,
    signatureHeader: validSig,
    authToken: AUTH_TOKEN,
    env: prodEnv,
  }),
)

const withQuery = `${PRODUCTION_WEBHOOK_URL}?region=ap-south-1`
const querySig = sign(withQuery, inboundBody, AUTH_TOKEN)
assert(
  'rejects URL without required query string',
  !verifyTwilioInboundWebhookSignature({
    validationUrl: PRODUCTION_WEBHOOK_URL,
    rawBody: inboundBody,
    signatureHeader: querySig,
    authToken: AUTH_TOKEN,
    env: prodEnv,
  }),
)

assert('skips outside production', !shouldVerifyTwilioWebhookSignature({ NODE_ENV: 'development' }))
assert(
  'non-production accepts invalid sig',
  verifyTwilioInboundWebhookSignature({
    validationUrl: PRODUCTION_WEBHOOK_URL,
    rawBody: inboundBody,
    signatureHeader: 'invalid',
    authToken: '',
    env: { NODE_ENV: 'development' },
  }),
)

const params = parseTwilioWebhook(inboundBody)
assert('parses CallSid', params.callSid === 'CA_stage1_sig_parity')
assert('parses Direction', params.Direction === 'inbound')

const routePath = path.join(
  process.cwd(),
  'apps/voice/app/api/v1/voice-agents/twilio/webhook/route.ts',
)
const source = fs.readFileSync(routePath, 'utf8')
assert(
  'route validates before Bolna branch',
  source.indexOf('verifyTwilioInboundWebhookSignature') < source.indexOf('shouldUseBolnaRuntime'),
)

assert(
  'response XML not part of signature',
  verifyTwilioSignature(validationUrl, inboundBody, validSig, AUTH_TOKEN) &&
    !verifyTwilioSignature(validationUrl, '<Response><Connect/></Response>', validSig, AUTH_TOKEN),
)

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`)
  process.exit(1)
}
console.log('\nAll twilio webhook signature parity checks passed.')
