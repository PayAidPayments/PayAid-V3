/**
 * Stage 1 — webhook signature parity: inbound POST validation is identical for
 * legacy <Gather> and Bolna <Connect><Stream> TwiML; only the response differs.
 */
import { describe, it, expect } from '@jest/globals'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { verifyTwilioSignature, parseTwilioWebhook } from '@/lib/twilio-utils'
import {
  TWILIO_VOICE_INBOUND_WEBHOOK_PATH,
  resolveTwilioWebhookValidationUrl,
  shouldVerifyTwilioWebhookSignature,
  verifyTwilioInboundWebhookSignature,
} from '@/lib/voice-agent/twilio-webhook-signature'

const AUTH_TOKEN = 'test-twilio-auth-token-stage1'
const PRODUCTION_WEBHOOK_URL =
  'https://payaid-v3.vercel.app/api/v1/voice-agents/twilio/webhook'
const INTERNAL_ORIGIN = 'https://payaid-v3-abc123.vercel.app'

function sign(url: string, body: string, token: string): string {
  return crypto.createHmac('sha1', token).update(url + body, 'utf-8').digest('base64')
}

/** Typical Twilio Voice status callback form body (full parameter set). */
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

describe('resolveTwilioWebhookValidationUrl', () => {
  const envBase = { NODE_ENV: 'production' as const }

  it('uses TWILIO_WEBHOOK_URL exactly when set (not request origin)', () => {
    const url = resolveTwilioWebhookValidationUrl(INTERNAL_ORIGIN, {
      ...envBase,
      TWILIO_WEBHOOK_URL: PRODUCTION_WEBHOOK_URL,
    })
    expect(url).toBe(PRODUCTION_WEBHOOK_URL)
    expect(url).not.toContain('abc123')
  })

  it('falls back to origin + canonical path only when TWILIO_WEBHOOK_URL is unset', () => {
    const url = resolveTwilioWebhookValidationUrl(INTERNAL_ORIGIN, {
      ...envBase,
      TWILIO_WEBHOOK_URL: '',
    })
    expect(url).toBe(`${INTERNAL_ORIGIN}${TWILIO_VOICE_INBOUND_WEBHOOK_PATH}`)
  })

  it('preserves query string on configured URL (Twilio signs full URL)', () => {
    const withQuery = `${PRODUCTION_WEBHOOK_URL}?region=ap-south-1`
    const url = resolveTwilioWebhookValidationUrl(INTERNAL_ORIGIN, {
      ...envBase,
      TWILIO_WEBHOOK_URL: withQuery,
    })
    expect(url).toBe(withQuery)
  })
})

describe('verifyTwilioInboundWebhookSignature (production)', () => {
  const prodEnv = {
    NODE_ENV: 'production',
    TWILIO_WEBHOOK_URL: PRODUCTION_WEBHOOK_URL,
  }

  it('accepts valid signature when validation URL matches Twilio webhook URL', () => {
    const validationUrl = resolveTwilioWebhookValidationUrl(INTERNAL_ORIGIN, prodEnv)
    const signature = sign(validationUrl, inboundBody, AUTH_TOKEN)
    expect(
      verifyTwilioInboundWebhookSignature({
        validationUrl,
        rawBody: inboundBody,
        signatureHeader: signature,
        authToken: AUTH_TOKEN,
        env: prodEnv,
      })
    ).toBe(true)
  })

  it('rejects when signature was computed with internal origin but TWILIO_WEBHOOK_URL is used', () => {
    const validationUrl = resolveTwilioWebhookValidationUrl(INTERNAL_ORIGIN, prodEnv)
    const wrongSignUrl = `${INTERNAL_ORIGIN}${TWILIO_VOICE_INBOUND_WEBHOOK_PATH}`
    const signature = sign(wrongSignUrl, inboundBody, AUTH_TOKEN)
    expect(
      verifyTwilioInboundWebhookSignature({
        validationUrl,
        rawBody: inboundBody,
        signatureHeader: signature,
        authToken: AUTH_TOKEN,
        env: prodEnv,
      })
    ).toBe(false)
  })

  it('rejects tampered POST body (missing/extra params break HMAC)', () => {
    const validationUrl = resolveTwilioWebhookValidationUrl(INTERNAL_ORIGIN, prodEnv)
    const signature = sign(validationUrl, inboundBody, AUTH_TOKEN)
    const tampered = `${inboundBody}&Foo=bar`
    expect(
      verifyTwilioInboundWebhookSignature({
        validationUrl,
        rawBody: tampered,
        signatureHeader: signature,
        authToken: AUTH_TOKEN,
        env: prodEnv,
      })
    ).toBe(false)
  })

  it('rejects tampered validation URL', () => {
    const validationUrl = resolveTwilioWebhookValidationUrl(INTERNAL_ORIGIN, prodEnv)
    const signature = sign(validationUrl, inboundBody, AUTH_TOKEN)
    const wrongUrl = 'https://evil.example/api/v1/voice-agents/twilio/webhook'
    expect(
      verifyTwilioInboundWebhookSignature({
        validationUrl: wrongUrl,
        rawBody: inboundBody,
        signatureHeader: signature,
        authToken: AUTH_TOKEN,
        env: prodEnv,
      })
    ).toBe(false)
  })

  it('accepts the same inbound body regardless of eventual TwiML branch (Gather vs Stream)', () => {
    const validationUrl = resolveTwilioWebhookValidationUrl(INTERNAL_ORIGIN, prodEnv)
    const signature = sign(validationUrl, inboundBody, AUTH_TOKEN)
    const verifyOnce = () =>
      verifyTwilioInboundWebhookSignature({
        validationUrl,
        rawBody: inboundBody,
        signatureHeader: signature,
        authToken: AUTH_TOKEN,
        env: prodEnv,
      })
    expect(verifyOnce()).toBe(true)
    expect(verifyOnce()).toBe(true)
  })

  it('rejects when query string on URL does not match signed URL', () => {
    const base = PRODUCTION_WEBHOOK_URL
    const withQuery = `${base}?region=ap-south-1`
    const signature = sign(withQuery, inboundBody, AUTH_TOKEN)
    expect(
      verifyTwilioInboundWebhookSignature({
        validationUrl: base,
        rawBody: inboundBody,
        signatureHeader: signature,
        authToken: AUTH_TOKEN,
        env: { ...prodEnv, TWILIO_WEBHOOK_URL: base },
      })
    ).toBe(false)
  })
})

describe('verifyTwilioInboundWebhookSignature (non-production)', () => {
  it('skips verification outside production', () => {
    expect(shouldVerifyTwilioWebhookSignature({ NODE_ENV: 'development' })).toBe(false)
    expect(
      verifyTwilioInboundWebhookSignature({
        validationUrl: PRODUCTION_WEBHOOK_URL,
        rawBody: inboundBody,
        signatureHeader: 'invalid',
        authToken: '',
        env: { NODE_ENV: 'development' },
      })
    ).toBe(true)
  })
})

describe('inbound field parsing (pre-branch, both TwiML paths)', () => {
  it('parses full Twilio form fields before Gather vs Connect/Stream branch', () => {
    const params = parseTwilioWebhook(inboundBody)
    expect(params.callSid).toBe('CA_stage1_sig_parity')
    expect(params.from).toBe('+919876543210')
    expect(params.to).toBe('+911234567890')
    expect(params.callStatus).toBe('ringing')
    expect(params.AccountSid).toBe('AC_test_account')
    expect(params.Direction).toBe('inbound')
  })
})

describe('TwiML response shape is independent of signature validation', () => {
  it('webhook route validates signature before Bolna vs Gather branch', () => {
    const routePath = path.join(
      process.cwd(),
      'apps/voice/app/api/v1/voice-agents/twilio/webhook/route.ts'
    )
    const source = fs.readFileSync(routePath, 'utf8')
    const sigIdx = source.indexOf('verifyTwilioInboundWebhookSignature')
    const bolnaIdx = source.indexOf('shouldUseBolnaRuntime')
    expect(sigIdx).toBeGreaterThan(-1)
    expect(bolnaIdx).toBeGreaterThan(sigIdx)
  })

  it('legacy Gather TwiML differs from Bolna Connect/Stream TwiML', () => {
    const gatherXml =
      '<Response><Say>Hello</Say><Gather input="speech" action="/speech-handler" method="POST"/></Response>'
    const streamXml =
      '<Response><Connect action="/connect-status" method="POST"><Stream url="wss://bolna.example/ws" track="inbound_track"/></Connect></Response>'
    expect(gatherXml).toContain('<Gather')
    expect(gatherXml).not.toContain('<Stream')
    expect(streamXml).toContain('<Connect')
    expect(streamXml).toContain('<Stream')
    expect(streamXml).not.toContain('<Gather')
  })

  it('verifyTwilioSignature uses url + raw body only (not response XML)', () => {
    const validationUrl = PRODUCTION_WEBHOOK_URL
    const signature = sign(validationUrl, inboundBody, AUTH_TOKEN)
    expect(verifyTwilioSignature(validationUrl, inboundBody, signature, AUTH_TOKEN)).toBe(true)
    expect(verifyTwilioSignature(validationUrl, '<Response><Connect></Connect></Response>', signature, AUTH_TOKEN)).toBe(
      false
    )
  })
})
