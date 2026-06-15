/**
 * Fast Stage 2 probe: buildBolnaAgent provider routing (no Jest harness).
 */
import { buildBolnaAgent } from '../../lib/voice-agent/runtime/bolna'

const base = {
  id: 'agent_stage2_probe',
  tenantId: 'tenant_probe',
  name: 'Stage2 Probe',
  description: null,
  language: 'hi',
  voiceId: null,
  voiceTone: 'warm',
  systemPrompt: 'Probe',
  phoneNumber: null,
  status: 'active',
  knowledgeBase: null,
  functions: null,
  workflow: { greeting: 'Namaste' },
  voiceRuntime: 'bolna',
  bolnaAgentId: null,
  runtimeSyncedAt: null,
}

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(msg)
    process.exit(1)
  }
}

const hi = buildBolnaAgent(base).tasks[0]
assert(hi.tools_config.transcriber?.provider === 'sarvam', 'hi ASR')
assert(hi.tools_config.synthesizer?.provider === 'sarvam', 'hi TTS')
assert(hi.tools_config.synthesizer?.provider_config?.model === 'bulbul:v3', 'hi model')
assert((hi.tools_config.synthesizer?.provider_config as { language?: string })?.language === 'hi-IN', 'hi locale')

const ta = buildBolnaAgent({ ...base, language: 'ta' }).tasks[0]
assert(ta.tools_config.synthesizer?.provider === 'sarvam', 'ta TTS')
assert((ta.tools_config.synthesizer?.provider_config as { voice_id?: string })?.voice_id === 'pavithra', 'ta speaker')

const en = buildBolnaAgent({ ...base, language: 'en' }).tasks[0]
assert(en.tools_config.transcriber?.provider === 'deepgram', 'en ASR')
assert(en.tools_config.synthesizer?.provider === 'elevenlabs', 'en TTS')

console.log('ok')
