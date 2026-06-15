/**
 * Auth helper for the `/api/v1/voice-agents/runtime/bolna/*` tenant-bridge
 * routes Bolna calls back into.
 *
 * Every request must carry BOTH:
 *   1. `X-PayAid-Bridge-Secret`  — shared secret (operational gate).
 *   2. `Authorization: Bearer <jwt>` — per-call JWT minted by buildBolnaStreamUrl().
 *
 * The JWT carries `tenantId`, `agentId`, `callSid` so we know exactly which
 * tenant Bolna is acting on behalf of, without trusting the request body.
 */

import { NextResponse } from 'next/server'
import type { BolnaCallJwtClaims } from './types'
import { verifyBolnaBridgeSecret, verifyBolnaCallJwt } from './bolna'

export interface BridgeAuthSuccess {
  ok: true
  claims: BolnaCallJwtClaims
}

export interface BridgeAuthFailure {
  ok: false
  response: NextResponse
}

export type BridgeAuthResult = BridgeAuthSuccess | BridgeAuthFailure

/**
 * Verify both the shared secret and the per-call JWT. Returns either decoded
 * claims (on success) or a `NextResponse` ready to be returned from the route.
 */
export function authenticateBolnaBridge(headers: Headers): BridgeAuthResult {
  if (!verifyBolnaBridgeSecret(headers)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid or missing X-PayAid-Bridge-Secret' },
        { status: 401 },
      ),
    }
  }

  const authHeader = headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Missing Authorization: Bearer <jwt>' },
        { status: 401 },
      ),
    }
  }

  try {
    const claims = verifyBolnaCallJwt(token)
    return { ok: true, claims }
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid Bolna call JWT', detail: error instanceof Error ? error.message : 'jwt error' },
        { status: 401 },
      ),
    }
  }
}
