/**
 * Tests for the Bolna agent-config builder.
 *
 * These tests are intentionally provider-mapping-focused: they pin the
 * Sarvam-vs-Deepgram, Bulbul-vs-ElevenLabs, and Groq-vs-OpenAI selection
 * rules from docs/VOICE_AGENT_BOLNA_INTEGRATION_PLAN.md §3.2 so we catch
 * accidental regressions when we re-tune providers later.
 *
 * The module reads env at import time via getters, so each test sets the
 * env it needs and we re-import a fresh module instance to avoid bleed.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

const ORIGINAL_ENV = { ...process.env }

function resetEnv() {
  // Wipe Bolna-specific keys so each test starts from a known baseline.
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
}

function loadModule() {
  // jest.isolateModules is the right primitive but isn't always available
  // under ts-jest in this project's harness; resetting `require.cache` on
  // the resolved path is portable and what other suites here use.
  const path = require.resolve('@/lib/voice-agent/runtime/bolna')
  delete require.cache[path]
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/voice-agent/runtime/bolna') as typeof import('@/lib/voice-agent/runtime/bolna')
}

const baseAgent = {
  id: 'agent_123',
  tenantId: 'tenant_abc',
  name: 'Priya the Closer',
  description: 'Inbound qualification',
  language: 'hi',
  voiceId: null,
  voiceTone: 'warm',
  systemPrompt: 'You are a polite Hindi-speaking sales assistant.',
  phoneNumber: '+919999999999',
  status: 'active',
  knowledgeBase: { id: 'kb_1' },
  functions: null,
  workflow: { greeting: 'Namaste! Priya bol rahi hoon.' },
  voiceRuntime: 'bolna' as const,
  bolnaAgentId: null,
  runtimeSyncedAt: null,
}

describe('buildBolnaAgent', () => {
  beforeEach(() => {
    resetEnv()
  })
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('applies voiceBehavior pace and verbosity to Sarvam speed and LLM max_tokens', () => {
    const { buildBolnaAgent } = loadModule()
    const config = buildBolnaAgent({
      ...baseAgent,
      workflow: {
        greeting: 'Namaste!',
        voiceBehavior: {
          version: 1,
          tonePreset: 'calm_warm',
          pacePreset: 'slow',
          verbosityPreset: 'brief',
        },
      },
    })
    const llm = config.tasks[0].tools_config.llm_agent.llm_config
    expect(llm.max_tokens).toBe(256)
    expect(config.tasks[0].tools_config.synthesizer?.provider_config).toMatchObject({
      speed: 0.85,
    })
  })

  it('routes Hindi to Sarvam Saarika ASR + Bulbul TTS at 8 kHz mulaw for Twilio', () => {
    const { buildBolnaAgent } = loadModule()
    const config = buildBolnaAgent(baseAgent)

    expect(config.tasks).toHaveLength(1)
    const task = config.tasks[0]
    expect(task.tools_config.transcriber?.provider).toBe('sarvam')
    expect(task.tools_config.transcriber?.model).toBe('saarika:v2')
    expect(task.tools_config.transcriber?.stream).toBe(true)
    expect(task.tools_config.synthesizer?.provider).toBe('sarvam')
    expect(task.tools_config.synthesizer?.provider_config).toMatchObject({
      voice_id: 'meera',
      language: 'hi-IN',
      model: 'bulbul:v3',
    })
    expect(task.tools_config.synthesizer?.audio_format).toBe('mulaw')
    expect(task.tools_config.synthesizer?.sampling_rate).toBe(8000)
    // Twilio is the inbound + outbound carrier for the streaming path.
    expect(task.tools_config.input?.provider).toBe('twilio')
    expect(task.tools_config.output?.provider).toBe('twilio')
  })

  it('routes English to Deepgram nova-2 ASR + ElevenLabs TTS', () => {
    const { buildBolnaAgent } = loadModule()
    const config = buildBolnaAgent({ ...baseAgent, language: 'en' })
    const task = config.tasks[0]
    expect(task.tools_config.transcriber?.provider).toBe('deepgram')
    expect(task.tools_config.transcriber?.model).toBe('nova-2')
    expect(task.tools_config.transcriber?.language).toBe('en-US')
    expect(task.tools_config.synthesizer?.provider).toBe('elevenlabs')
    expect(task.tools_config.synthesizer?.audio_format).toBe('mulaw')
  })

  it.each([
    ['ta', 'pavithra', 'ta-IN'],
    ['te', 'maitreyi', 'te-IN'],
    ['kn', 'arvind', 'kn-IN'],
  ])('routes %s to Sarvam ASR + Bulbul TTS', (language, speaker, locale) => {
    const { buildBolnaAgent } = loadModule()
    const task = buildBolnaAgent({ ...baseAgent, language }).tasks[0]
    expect(task.tools_config.transcriber?.provider).toBe('sarvam')
    expect(task.tools_config.synthesizer?.provider).toBe('sarvam')
    expect(task.tools_config.synthesizer?.provider_config).toMatchObject({
      voice_id: speaker,
      language: locale,
      model: 'bulbul:v3',
    })
  })

  it('keeps en-IN on Sarvam (Indian-English accent handling)', () => {
    const { buildBolnaAgent } = loadModule()
    const config = buildBolnaAgent({ ...baseAgent, language: 'en-IN' })
    const task = config.tasks[0]
    expect(task.tools_config.transcriber?.provider).toBe('sarvam')
  })

  it('prefers Groq when GROQ_API_KEY is set, falls back to OpenAI otherwise', () => {
    process.env.GROQ_API_KEY = 'gsk_test_key'
    let { buildBolnaAgent } = loadModule()
    let task = buildBolnaAgent(baseAgent).tasks[0]
    expect(task.tools_config.llm_agent.llm_config.provider).toBe('groq')
    expect(task.tools_config.llm_agent.llm_config.model).toBe('llama-3.1-8b-instant')

    delete process.env.GROQ_API_KEY
    process.env.OPENAI_API_KEY = 'sk-test'
    ;({ buildBolnaAgent } = loadModule())
    task = buildBolnaAgent(baseAgent).tasks[0]
    expect(task.tools_config.llm_agent.llm_config.provider).toBe('openai')
    expect(task.tools_config.llm_agent.llm_config.model).toBe('gpt-4o-mini')
  })

  it('declares streaming flow + parallel toolchain (real-time invariant)', () => {
    const { buildBolnaAgent } = loadModule()
    const task = buildBolnaAgent(baseAgent).tasks[0]
    expect(task.toolchain.execution).toBe('parallel')
    expect(task.toolchain.pipelines).toEqual([['transcriber', 'llm', 'synthesizer']])
    expect(task.tools_config.llm_agent.agent_flow_type).toBe('streaming')
  })

  it('registers kb_search tool only when the agent has a knowledge base', () => {
    const { buildBolnaAgent } = loadModule()
    const withKb = buildBolnaAgent(baseAgent).tasks[0].tools || []
    const withoutKb = buildBolnaAgent({ ...baseAgent, knowledgeBase: null }).tasks[0].tools || []
    expect(withKb.some((t) => t.name === 'kb_search')).toBe(true)
    expect(withoutKb.some((t) => t.name === 'kb_search')).toBe(false)
    // execute_action is always registered so any side-effect tool is reachable.
    expect(withKb.some((t) => t.name === 'execute_action')).toBe(true)
    expect(withoutKb.some((t) => t.name === 'execute_action')).toBe(true)
  })

  it('points all tool webhooks at the PayAid bridge with the shared secret header', () => {
    const { buildBolnaAgent } = loadModule()
    const tools = buildBolnaAgent(baseAgent).tasks[0].tools || []
    for (const tool of tools) {
      expect(tool.webhook.url.startsWith('https://payaid.test/api/v1/voice-agents/runtime/bolna/')).toBe(true)
      expect(tool.webhook.url).toContain(`agentId=${baseAgent.id}`)
      expect(tool.webhook.method).toBe('POST')
      expect(tool.webhook.headers?.['X-PayAid-Bridge-Secret']).toBe(process.env.BOLNA_BRIDGE_SECRET)
    }
  })

  it('uses workflow.greeting when present and falls back to a synthesized one otherwise', () => {
    const { buildBolnaAgent } = loadModule()
    const greet = buildBolnaAgent(baseAgent).agent_welcome_message
    expect(greet).toContain('Namaste')

    const fallback = buildBolnaAgent({
      ...baseAgent,
      workflow: null,
      description: null,
    }).agent_welcome_message
    expect(fallback).toContain('Priya the Closer')
  })
})
