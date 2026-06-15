/**
 * Tests for the Bolna bridge auth surface:
 *   - Per-call JWT mint + verify round-trip
 *   - Constant-time bridge-secret comparison
 *   - shouldUseBolnaRuntime() flag wiring
 *   - buildBolnaStreamUrl() refuses to mint a URL until the agent has been
 *     synced (defends against accidentally pointing Twilio at a sidecar
 *     that does not yet know about the agent).
 *
 * These guards underpin the security boundary between Bolna and PayAid; if
 * they break we silently leak tenant context across calls.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

const ORIGINAL_ENV = { ...process.env }

function resetEnv(overrides: Record<string, string | undefined> = {}) {
  for (const key of [
    'GROQ_API_KEY',
    'OPENAI_API_KEY',
    'BOLNA_BRIDGE_SECRET',
    'PAYAID_BRIDGE_BASE_URL',
    'BOLNA_API_BASE_URL',
    'BOLNA_PUBLIC_WS_HOST',
    'VOICE_AGENT_BOLNA_ENABLED',
  ]) {
    delete process.env[key]
  }
  process.env.BOLNA_BRIDGE_SECRET = 'test-bridge-secret-min-16chars-xx'
  process.env.PAYAID_BRIDGE_BASE_URL = 'https://payaid.test'
  process.env.BOLNA_API_BASE_URL = 'https://bolna.test'
  process.env.BOLNA_PUBLIC_WS_HOST = 'bolna-ws.test'
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
}

function loadModule() {
  const path = require.resolve('@/lib/voice-agent/runtime/bolna')
  delete require.cache[path]
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/voice-agent/runtime/bolna') as typeof import('@/lib/voice-agent/runtime/bolna')
}

describe('mintBolnaCallJwt + verifyBolnaCallJwt', () => {
  beforeEach(() => resetEnv())
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('round-trips tenant/agent/call claims', () => {
    const { mintBolnaCallJwt, verifyBolnaCallJwt } = loadModule()
    const { token, expiresAt } = mintBolnaCallJwt({
      tenantId: 'tenant_xyz',
      agentId: 'agent_42',
      callSid: 'CAabc123',
    })
    expect(token.split('.')).toHaveLength(3) // header.payload.signature
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now())

    const claims = verifyBolnaCallJwt(token)
    expect(claims.tenantId).toBe('tenant_xyz')
    expect(claims.agentId).toBe('agent_42')
    expect(claims.callSid).toBe('CAabc123')
    expect(typeof claims.iat).toBe('number')
    expect(typeof claims.exp).toBe('number')
  })

  it('rejects a token signed by a different bridge secret', () => {
    const { mintBolnaCallJwt } = loadModule()
    const { token } = mintBolnaCallJwt({ tenantId: 't', agentId: 'a', callSid: 'c' })

    // Re-load with a different secret and confirm verify fails.
    resetEnv({ BOLNA_BRIDGE_SECRET: 'a-different-bridge-secret-16xx!' })
    const { verifyBolnaCallJwt } = loadModule()
    expect(() => verifyBolnaCallJwt(token)).toThrow()
  })

  it('refuses to mint when BOLNA_BRIDGE_SECRET is too short or missing', () => {
    resetEnv({ BOLNA_BRIDGE_SECRET: 'short' })
    const { mintBolnaCallJwt } = loadModule()
    expect(() => mintBolnaCallJwt({ tenantId: 't', agentId: 'a', callSid: 'c' })).toThrow(
      /BOLNA_BRIDGE_SECRET must be set/i,
    )
  })

  it('rejects an expired token', () => {
    const { mintBolnaCallJwt, verifyBolnaCallJwt } = loadModule()
    // Issue a token that is already 5 seconds in the past (TTL=-5).
    const { token } = mintBolnaCallJwt({ tenantId: 't', agentId: 'a', callSid: 'c' }, -5)
    expect(() => verifyBolnaCallJwt(token)).toThrow()
  })
})

describe('verifyBolnaBridgeSecret', () => {
  beforeEach(() => resetEnv())
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('accepts the configured secret', () => {
    const { verifyBolnaBridgeSecret } = loadModule()
    const headers = new Headers({ 'x-payaid-bridge-secret': process.env.BOLNA_BRIDGE_SECRET as string })
    expect(verifyBolnaBridgeSecret(headers)).toBe(true)
  })

  it('rejects mismatched and empty secrets', () => {
    const { verifyBolnaBridgeSecret } = loadModule()
    expect(verifyBolnaBridgeSecret(new Headers({ 'x-payaid-bridge-secret': 'wrong' }))).toBe(false)
    expect(verifyBolnaBridgeSecret(new Headers())).toBe(false)
  })

  it('rejects when the env secret is unset', () => {
    resetEnv({ BOLNA_BRIDGE_SECRET: undefined })
    const { verifyBolnaBridgeSecret } = loadModule()
    expect(verifyBolnaBridgeSecret(new Headers({ 'x-payaid-bridge-secret': 'anything' }))).toBe(false)
  })
})

describe('shouldUseBolnaRuntime', () => {
  beforeEach(() => resetEnv())
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('requires BOTH the env flag and per-agent runtime selection', () => {
    const { shouldUseBolnaRuntime } = loadModule()
    expect(shouldUseBolnaRuntime({ voiceRuntime: 'bolna' })).toBe(false) // flag off
    process.env.VOICE_AGENT_BOLNA_ENABLED = '1'
    // Re-import so the cached `isBolnaRuntimeEnabled` reads the new env.
    const { shouldUseBolnaRuntime: shouldUseBolnaRuntimeReloaded } = loadModule()
    expect(shouldUseBolnaRuntimeReloaded({ voiceRuntime: 'native' })).toBe(false)
    expect(shouldUseBolnaRuntimeReloaded({ voiceRuntime: 'bolna' })).toBe(true)
  })

  it('treats values other than "1" as disabled (matches scripts/strict-flag convention)', () => {
    process.env.VOICE_AGENT_BOLNA_ENABLED = 'true'
    const { shouldUseBolnaRuntime } = loadModule()
    expect(shouldUseBolnaRuntime({ voiceRuntime: 'bolna' })).toBe(false)
  })
})

describe('buildBolnaStreamUrl', () => {
  beforeEach(() => resetEnv())
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  const baseAgent = {
    id: 'agent_42',
    tenantId: 'tenant_xyz',
    name: 'Priya',
    description: null,
    language: 'hi',
    voiceId: null,
    voiceTone: null,
    systemPrompt: 'sp',
    phoneNumber: null,
    status: 'active',
    knowledgeBase: null,
    functions: null,
    workflow: null,
    voiceRuntime: 'bolna' as const,
    bolnaAgentId: 'b_999',
    runtimeSyncedAt: new Date(),
  }

  it('refuses to build a stream URL when the agent has not been synced', () => {
    const { buildBolnaStreamUrl } = loadModule()
    expect(() =>
      buildBolnaStreamUrl({
        agent: { ...baseAgent, bolnaAgentId: null },
        callSid: 'CA1',
        from: '+91123',
        to: '+91456',
        payaidOrigin: 'https://payaid.test',
      }),
    ).toThrow(/no bolnaAgentId/)
  })

  it('encodes call context into the WSS URL and ships a fresh JWT', () => {
    const { buildBolnaStreamUrl, verifyBolnaCallJwt } = loadModule()
    const result = buildBolnaStreamUrl({
      agent: baseAgent,
      callSid: 'CA1',
      from: '+91123',
      to: '+91456',
      payaidOrigin: 'https://payaid.test',
    })
    expect(result.streamUrl.startsWith('wss://bolna-ws.test/twilio?')).toBe(true)
    expect(result.streamUrl).toContain('agentId=b_999')
    expect(result.streamUrl).toContain('payaidAgentId=agent_42')
    expect(result.streamUrl).toContain('callSid=CA1')
    expect(result.streamUrl).toContain('jwt=')
    // The bridge URL embedded for Bolna's outbound webhooks must hit our app.
    expect(result.streamUrl).toContain(encodeURIComponent('https://payaid.test/api/v1/voice-agents/runtime/bolna'))

    const claims = verifyBolnaCallJwt(result.jwt)
    expect(claims).toEqual(
      expect.objectContaining({ tenantId: 'tenant_xyz', agentId: 'agent_42', callSid: 'CA1' }),
    )
  })
})
