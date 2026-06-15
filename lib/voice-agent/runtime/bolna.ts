/**
 * Bolna real-time runtime adapter for PayAid Voice Agents.
 *
 * Translates a `voiceAgent` row into Bolna's agent JSON, talks to the Bolna
 * sidecar over its REST API for upserts and call initiation, and mints / verifies
 * the per-call JWT we use to authenticate Bolna -> PayAid bridge callbacks.
 *
 * Architecture: docs/VOICE_AGENT_BOLNA_INTEGRATION_PLAN.md
 * Sidecar:      deployment/bolna/{docker-compose.yml,.env.sample,README.md}
 *
 * This module is only imported on the server side. Do not pull it into client
 * components; it reads env vars and signs JWTs.
 */

import { sign as jwtSign, verify as jwtVerify, type JwtPayload } from 'jsonwebtoken'
import type {
  BolnaAgentConfig,
  BolnaCallJwtClaims,
  BolnaSynthesizerConfig,
  BolnaToolDefinition,
  BolnaTranscriberConfig,
  StartBolnaCallArgs,
  StartBolnaCallResult,
  SyncBolnaAgentResult,
  VoiceAgentRow,
} from './types'
import { buildMergedSystemContext } from '../agent-runtime-context'
import {
  maxTokensForVerbosity,
  parseVoiceBehaviorFromWorkflow,
  sarvamSpeedForPace,
} from '../voice-behavior-config'
import { BOLNA_FALLBACK_REASONS, type BolnaFallbackReason } from './inbound-observability'

// ─── Env helpers ─────────────────────────────────────────────────────────────

function readEnv(name: string): string | undefined {
  const value = process.env[name]
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

/** Pre-flight env for inbound Bolna cutover (no network). */
export function readEnvForInbound():
  | { ok: true }
  | { ok: false; reason: BolnaFallbackReason; detail: string } {
  try {
    getBolnaPublicWsHost()
  } catch (e) {
    return {
      ok: false,
      reason: BOLNA_FALLBACK_REASONS.MISSING_BOLNA_HOST,
      detail: e instanceof Error ? e.message : String(e),
    }
  }
  try {
    getBridgeSecret()
  } catch (e) {
    return {
      ok: false,
      reason: BOLNA_FALLBACK_REASONS.MISSING_BRIDGE_SECRET,
      detail: e instanceof Error ? e.message : String(e),
    }
  }
  const bridgeBase = readEnv('PAYAID_BRIDGE_BASE_URL')
  if (!bridgeBase) {
    return {
      ok: false,
      reason: BOLNA_FALLBACK_REASONS.MISSING_BRIDGE_BASE_URL,
      detail: 'PAYAID_BRIDGE_BASE_URL is not set',
    }
  }
  return { ok: true }
}

/** Convention: `'1'` enables; everything else disables. Mirrors `scripts/strict-flag`. */
export function isBolnaRuntimeEnabled(): boolean {
  return readEnv('VOICE_AGENT_BOLNA_ENABLED') === '1'
}

export function getBolnaApiBaseUrl(): string {
  const url = readEnv('BOLNA_API_BASE_URL')
  if (!url) {
    throw new Error(
      '[bolna-runtime] BOLNA_API_BASE_URL is not set. ' +
        'Point it at the bolna-app service from deployment/bolna/docker-compose.yml.',
    )
  }
  return url.replace(/\/$/, '')
}

export function getBolnaPublicWsHost(): string {
  const host = readEnv('BOLNA_PUBLIC_WS_HOST')
  if (!host) {
    throw new Error(
      '[bolna-runtime] BOLNA_PUBLIC_WS_HOST is not set. ' +
        'Set it to the public hostname Twilio Media Streams should connect to (e.g. bolna.payaid.example).',
    )
  }
  return host.replace(/\/$/, '')
}

function getBridgeSecret(): string {
  const secret = readEnv('BOLNA_BRIDGE_SECRET')
  if (!secret || secret.length < 16) {
    throw new Error(
      '[bolna-runtime] BOLNA_BRIDGE_SECRET must be set to a strong (>=16 char) random value. ' +
        'It signs per-call JWTs and gates the /runtime/bolna/* endpoints.',
    )
  }
  return secret
}

// ─── Provider mapping ────────────────────────────────────────────────────────

const INDIAN_LANGUAGES = new Set([
  'hi',
  'ta',
  'te',
  'kn',
  'mr',
  'gu',
  'pa',
  'bn',
  'ml',
  'or',
  'as',
  'ne',
  'ur',
])

function pickTranscriber(language: string): BolnaTranscriberConfig {
  const lang = language.toLowerCase()
  // Sarvam Saarika handles Indian languages best (and en-IN); fall back to Deepgram nova-2 for others.
  if (INDIAN_LANGUAGES.has(lang) || lang === 'en-in') {
    return {
      provider: 'sarvam',
      model: 'saarika:v2',
      language: lang === 'en' ? 'en-IN' : lang,
      stream: true,
      smart_format: true,
    }
  }
  return {
    provider: 'deepgram',
    model: 'nova-2',
    language: lang === 'en' ? 'en-US' : lang,
    stream: true,
    smart_format: true,
    endpointing: 200, // ms — Deepgram smart endpointing window
  }
}

function pickSynthesizer(language: string, voiceId?: string | null, voiceTone?: string | null): BolnaSynthesizerConfig {
  const lang = language.toLowerCase()
  // Indian languages → Sarvam Bulbul (streaming) for natural intonation.
  if (INDIAN_LANGUAGES.has(lang)) {
    const speaker = voiceId || defaultBulbulSpeaker(lang)
    const locale = bulbulLocale(lang)
    // Bolna upstream SynthesizerProvider.SARVAM + SarvamConfig (voice_id, voice, language, model, speed).
    return {
      provider: 'sarvam',
      provider_config: {
        voice_id: speaker,
        voice: speaker,
        language: locale,
        model: 'bulbul:v3',
        speed: 1.0,
      },
      stream: true,
      audio_format: 'mulaw',
      sampling_rate: 8000,
    }
  }
  // English / others → ElevenLabs streaming (low-latency, good Indian-English accents).
  return {
    provider: 'elevenlabs',
    provider_config: {
      voice: voiceId || 'JBFqnCBsd6RMkjVDRZzb',
      voice_id: voiceId || 'JBFqnCBsd6RMkjVDRZzb',
      model: 'eleven_turbo_v2_5',
      voice_settings: voiceToneToElevenSettings(voiceTone),
    },
    stream: true,
    audio_format: 'mulaw',
    sampling_rate: 8000,
  }
}

function defaultBulbulSpeaker(language: string): string {
  // Deterministic mapping; agent-level voiceId still wins when provided.
  const map: Record<string, string> = {
    hi: 'meera',
    ta: 'pavithra',
    te: 'maitreyi',
    kn: 'arvind',
    mr: 'amol',
    gu: 'arjun',
    pa: 'arjun',
    bn: 'misha',
    ml: 'arvind',
    or: 'arvind',
  }
  return map[language] || 'meera'
}

function bulbulLocale(language: string): string {
  return language === 'or' ? 'od-IN' : `${language}-IN`
}

function voiceToneToElevenSettings(voiceTone?: string | null): Record<string, number> {
  const tone = (voiceTone || '').toLowerCase()
  if (tone === 'professional' || tone === 'formal') {
    return { stability: 0.55, similarity_boost: 0.8, style: 0.15 }
  }
  if (tone === 'friendly' || tone === 'warm') {
    return { stability: 0.4, similarity_boost: 0.7, style: 0.4 }
  }
  if (tone === 'casual' || tone === 'calm') {
    return { stability: 0.35, similarity_boost: 0.7, style: 0.25 }
  }
  return { stability: 0.45, similarity_boost: 0.75, style: 0.2 }
}

function resolveLlmProvider(): { provider: string; model: string; family: string } {
  // Prefer Groq (already configured for our voice path) for low latency; fall back to OpenAI.
  if (readEnv('GROQ_API_KEY')) {
    return { provider: 'groq', model: 'llama-3.1-8b-instant', family: 'llama' }
  }
  if (readEnv('OPENAI_API_KEY')) {
    return { provider: 'openai', model: 'gpt-4o-mini', family: 'gpt-4' }
  }
  // Falls through to whatever Bolna's default is — but warn so ops can see it.
  console.warn(
    '[bolna-runtime] Neither GROQ_API_KEY nor OPENAI_API_KEY set; ' +
      'Bolna will use whatever LLM is configured in its own env. Latency may degrade.',
  )
  return { provider: 'openai', model: 'gpt-4o-mini', family: 'gpt-4' }
}

// ─── Agent JSON builder ──────────────────────────────────────────────────────

function complianceIntroPrefix(agent: VoiceAgentRow): string {
  const compliance = agent.compliance as { introText?: string } | null | undefined
  const intro = compliance?.introText
  if (!intro || !String(intro).trim()) return ''
  return `${String(intro).trim()} `
}

/** Canonical welcome text for Bolna TTS and Twilio fallback `<Say>`. */
export function resolveGreeting(agent: VoiceAgentRow): string {
  const workflow = agent.workflow as
    | { greeting?: string; nodes?: Array<{ type: string; data?: { text?: string } }> }
    | null
    | undefined
  let greeting: string
  if (workflow?.greeting && String(workflow.greeting).trim()) {
    greeting = String(workflow.greeting).slice(0, 500)
  } else {
    const greetingNode = workflow?.nodes?.find((n) => n.type === 'greeting')
    if (greetingNode?.data?.text && String(greetingNode.data.text).trim()) {
      greeting = String(greetingNode.data.text).slice(0, 500)
    } else if (agent.description?.trim()) {
      greeting = agent.description.trim().slice(0, 200)
    } else {
      greeting = `Hello, you've reached ${agent.name}. How can I help you?`
    }
  }
  return `${complianceIntroPrefix(agent)}${greeting}`
}

function bolnaLlmSystemPrompt(agent: VoiceAgentRow): string {
  return buildMergedSystemContext(agent, {
    trainingPackApproved: agent.trainingPackApproved ?? null,
  })
}

function buildBridgeWebhook(agentId: string, path: string): { url: string; method: 'POST'; headers: Record<string, string> } {
  const base = readEnv('PAYAID_BRIDGE_BASE_URL')
  if (!base) {
    throw new Error(
      '[bolna-runtime] PAYAID_BRIDGE_BASE_URL is not set. ' +
        'Bolna needs it to call back into the PayAid app for tools/KB/events. ' +
        'Set it to the internal hostname of the PayAid Next.js app.',
    )
  }
  const trimmed = base.replace(/\/$/, '')
  return {
    url: `${trimmed}${path}?agentId=${encodeURIComponent(agentId)}`,
    method: 'POST',
    headers: {
      // Shared secret (operational gate). The per-call JWT is added at call time
      // and travels in `Authorization: Bearer <jwt>` on each tool execution.
      'X-PayAid-Bridge-Secret': getBridgeSecret(),
    },
  }
}

function buildBuiltinTools(agent: VoiceAgentRow): BolnaToolDefinition[] {
  const tools: BolnaToolDefinition[] = []

  // KB lookup — only register when knowledge base is configured on the agent.
  if (agent.knowledgeBase) {
    tools.push({
      name: 'kb_search',
      description: 'Search the agent knowledge base for relevant context to answer the caller.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Caller question or topic to search.' },
          topK: { type: 'integer', description: 'Max results (default 3, max 5).', minimum: 1, maximum: 5 },
        },
        required: ['query'],
      },
      webhook: buildBridgeWebhook(agent.id, '/api/v1/voice-agents/runtime/bolna/kb/search'),
    })
  }

  // Generic tool executor — agent functions metadata is forwarded so the LLM
  // can call any registered ToolExecutor action through one webhook surface.
  // The receiving route delegates to lib/voice-agent/tool-executor.
  tools.push({
    name: 'execute_action',
    description:
      'Execute a side-effect action (CRM update, payment link, send WhatsApp, schedule callback). ' +
      'Use sparingly; only when the caller clearly asks for it. Sensitive actions are draft-first.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Tool name registered in PayAid (e.g. send_payment_link).' },
        args: { type: 'object', description: 'Arguments matching the named tool schema.' },
      },
      required: ['action'],
    },
    webhook: buildBridgeWebhook(agent.id, '/api/v1/voice-agents/runtime/bolna/tools/execute'),
  })

  return tools
}

export function buildBolnaAgent(agent: VoiceAgentRow): BolnaAgentConfig {
  const voiceBehavior = parseVoiceBehaviorFromWorkflow(agent.workflow)
  const transcriber = pickTranscriber(agent.language)
  let synthesizer = pickSynthesizer(agent.language, agent.voiceId, agent.voiceTone)
  if (synthesizer.provider === 'sarvam') {
    synthesizer = {
      ...synthesizer,
      provider_config: {
        ...synthesizer.provider_config,
        speed: sarvamSpeedForPace(voiceBehavior.pacePreset),
      },
    }
  }
  const llm = resolveLlmProvider()
  const greeting = resolveGreeting(agent)
  const maxTokens = maxTokensForVerbosity(voiceBehavior.verbosityPreset)

  return {
    agent_name: `${agent.name} [${agent.id}]`.slice(0, 80),
    agent_welcome_message: greeting,
    agent_type: 'streaming',
    tasks: [
      {
        task_type: 'conversation',
        toolchain: {
          execution: 'parallel',
          pipelines: [['transcriber', 'llm', 'synthesizer']],
        },
        tools_config: {
          input: { provider: 'twilio' },
          transcriber,
          llm_agent: {
            agent_type: 'simple_llm_agent',
            agent_flow_type: 'streaming',
            llm_config: {
              provider: llm.provider,
              model: llm.model,
              family: llm.family,
              temperature: 0.3,
              max_tokens: maxTokens,
              system_prompt: bolnaLlmSystemPrompt(agent),
            },
          },
          synthesizer,
          output: { provider: 'twilio' },
        },
        tools: buildBuiltinTools(agent),
      },
    ],
  }
}

// ─── Bolna API client ────────────────────────────────────────────────────────

async function bolnaFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const base = getBolnaApiBaseUrl()
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const apiKey = readEnv('BOLNA_API_KEY')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`[bolna-runtime] ${init.method || 'GET'} ${path} failed: ${res.status} ${body.slice(0, 500)}`)
  }
  return res
}

/**
 * Upsert the agent into Bolna. Idempotent: if `agent.bolnaAgentId` is already
 * set, we PUT; otherwise we POST and the caller persists the returned id.
 *
 * Caller is responsible for updating `voiceAgent.bolnaAgentId` and
 * `runtimeSyncedAt` after a successful sync.
 */
export async function syncBolnaAgent(agent: VoiceAgentRow): Promise<SyncBolnaAgentResult> {
  const config = buildBolnaAgent(agent)
  const isUpdate = !!agent.bolnaAgentId
  const path = isUpdate ? `/v1/agent/${agent.bolnaAgentId}` : '/v1/agent'
  const res = await bolnaFetch(path, {
    method: isUpdate ? 'PUT' : 'POST',
    body: JSON.stringify(config),
  })
  const data = (await res.json().catch(() => ({}))) as { agent_id?: string; id?: string }
  const bolnaAgentId = data.agent_id || data.id || agent.bolnaAgentId
  if (!bolnaAgentId) {
    throw new Error('[bolna-runtime] Bolna upsert succeeded but did not return an agent id')
  }
  return { bolnaAgentId, syncedAt: new Date() }
}

/** Tear-down on agent delete or runtime switch. Best-effort; logs and swallows 404s. */
export async function deleteBolnaAgent(bolnaAgentId: string): Promise<void> {
  try {
    await bolnaFetch(`/v1/agent/${bolnaAgentId}`, { method: 'DELETE' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('404')) return
    console.warn('[bolna-runtime] deleteBolnaAgent failed:', message)
  }
}

// ─── Per-call JWT ────────────────────────────────────────────────────────────

const DEFAULT_JWT_TTL_SECONDS = 60 * 60 // 1 hour

export function mintBolnaCallJwt(
  claims: Pick<BolnaCallJwtClaims, 'tenantId' | 'agentId' | 'callSid'>,
  ttlSeconds: number = DEFAULT_JWT_TTL_SECONDS,
): { token: string; expiresAt: Date } {
  const secret = getBridgeSecret()
  const issuedAt = Math.floor(Date.now() / 1000)
  const expiresAt = issuedAt + ttlSeconds
  const token = jwtSign(
    { tenantId: claims.tenantId, agentId: claims.agentId, callSid: claims.callSid, iat: issuedAt, exp: expiresAt },
    secret,
    { algorithm: 'HS256' },
  )
  return { token, expiresAt: new Date(expiresAt * 1000) }
}

export function verifyBolnaCallJwt(token: string): BolnaCallJwtClaims {
  const secret = getBridgeSecret()
  const decoded = jwtVerify(token, secret, { algorithms: ['HS256'] }) as JwtPayload & Partial<BolnaCallJwtClaims>
  if (!decoded || typeof decoded !== 'object') throw new Error('Invalid Bolna call JWT')
  const { tenantId, agentId, callSid } = decoded
  if (!tenantId || !agentId || !callSid) throw new Error('Bolna call JWT missing tenantId/agentId/callSid')
  return { tenantId, agentId, callSid, iat: decoded.iat, exp: decoded.exp }
}

/**
 * Verify the shared bridge secret on incoming requests from Bolna.
 * Use this on every `/runtime/bolna/*` route in addition to the per-call JWT.
 */
export function verifyBolnaBridgeSecret(headers: Headers): boolean {
  const expected = readEnv('BOLNA_BRIDGE_SECRET')
  if (!expected) return false
  const received = headers.get('x-payaid-bridge-secret') || ''
  if (received.length !== expected.length) return false
  // Constant-time compare to avoid timing leaks.
  let mismatch = 0
  for (let i = 0; i < received.length; i++) {
    mismatch |= received.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return mismatch === 0
}

// ─── Call lifecycle ──────────────────────────────────────────────────────────

/**
 * Build the public WSS URL Twilio's `<Connect><Stream>` should hit, plus a
 * fresh per-call JWT. The caller (Twilio webhook) then returns this URL to
 * Twilio so the media stream connects directly to the Bolna sidecar.
 *
 * We do not call Bolna's REST API here — Bolna picks up the call when the
 * WS handshake arrives and reads the `agentId` + `jwt` query params.
 */
export function buildBolnaStreamUrl(args: StartBolnaCallArgs): StartBolnaCallResult {
  if (!args.agent.bolnaAgentId) {
    throw new Error(
      `[bolna-runtime] agent ${args.agent.id} has no bolnaAgentId; ` +
        'sync the agent with syncBolnaAgent() before placing calls.',
    )
  }

  const host = getBolnaPublicWsHost()
  const { token, expiresAt } = mintBolnaCallJwt({
    tenantId: args.agent.tenantId,
    agentId: args.agent.id,
    callSid: args.callSid,
  })

  const params = new URLSearchParams({
    agentId: args.agent.bolnaAgentId,
    payaidAgentId: args.agent.id,
    callSid: args.callSid,
    from: args.from,
    to: args.to,
    jwt: token,
    bridge: `${args.payaidOrigin}/api/v1/voice-agents/runtime/bolna`,
  })

  return {
    streamUrl: `wss://${host}/twilio?${params.toString()}`,
    jwt: token,
    expiresAt,
  }
}

/** Helper: should this agent route through Bolna right now? */
export function shouldUseBolnaRuntime(agent: Pick<VoiceAgentRow, 'voiceRuntime'>): boolean {
  return isBolnaRuntimeEnabled() && agent.voiceRuntime === 'bolna'
}
