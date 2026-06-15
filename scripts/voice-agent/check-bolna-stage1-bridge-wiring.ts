/**
 * Stage 1 bridge wiring checks (tools → ToolExecutor, KB → searchKnowledgeBase, events).
 */
import fs from 'node:fs'
import path from 'node:path'
import {
  appendBolnaTranscript,
  computeFirstAudioPercentiles,
  pickFirstAudioMs,
  pickTtsLatencyMs,
} from '../../lib/voice-agent/runtime/bolna-events'
import { isDraftFirstToolName } from '../../lib/voice-agent/runtime/bolna-tool-policy'

const root = process.cwd()
let failed = 0

function assert(name: string, condition: boolean): void {
  if (!condition) {
    console.error(`FAIL: ${name}`)
    failed += 1
    return
  }
  console.log(`ok: ${name}`)
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

const toolsRoute = read('apps/voice/app/api/v1/voice-agents/runtime/bolna/tools/execute/route.ts')
const kbRoute = read('apps/voice/app/api/v1/voice-agents/runtime/bolna/kb/search/route.ts')
const eventsRoute = read('apps/voice/app/api/v1/voice-agents/runtime/bolna/events/route.ts')

assert('tools/execute delegates to bolna-tool-bridge', toolsRoute.includes('executeBolnaBridgeTool'))
assert('tools/execute uses bridge auth', toolsRoute.includes('authenticateBolnaBridge'))
assert('kb/search uses searchKnowledgeBase', kbRoute.includes('searchKnowledgeBase'))
assert('events uses appendBolnaTranscript helper', eventsRoute.includes('appendBolnaTranscript'))
assert('events persists barge_in KPIs', eventsRoute.includes("case 'barge_in'"))

const existing = appendBolnaTranscript(null, { role: 'user', content: 'Hi' })
const merged = appendBolnaTranscript(existing, { role: 'assistant', content: 'Hello' })
const history = JSON.parse(merged) as Array<{ role: string; content: string }>
assert('transcript append keeps two turns', history.length === 2)
assert(
  'pickFirstAudioMs prefers first_audio_ms',
  pickFirstAudioMs({ first_audio_ms: 900, tts_first_chunk_ms: 1200 }) === 900,
)
assert(
  'pickTtsLatencyMs uses tts_first_chunk_ms',
  pickTtsLatencyMs({ tts_first_chunk_ms: 800 }) === 800,
)

const pct = computeFirstAudioPercentiles([
  { firstAudioMs: 400, runtime: 'bolna' },
  { firstAudioMs: 1200, runtime: 'bolna' },
  { firstAudioMs: 2000, runtime: 'native' },
])
assert('percentile samples counted', pct.samples === 3)
assert('p50 computed', pct.p50 === 1200)

assert('draft-first payment tool', isDraftFirstToolName('send_payment_link'))
assert('ping is not draft-first', !isDraftFirstToolName('ping'))

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nBolna Stage 1 bridge wiring checks passed.')
