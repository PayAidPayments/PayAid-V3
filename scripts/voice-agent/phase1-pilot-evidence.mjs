/**
 * Phase 1 pilot evidence pack — writes analytics runtime snapshot to docs/evidence/voice-agent/.
 *
 * Env: BASE_URL, AUTH_TOKEN (or API_AUTH_TOKEN), optional agentId, period=week
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false, quiet: true })

const iso = new Date().toISOString()
const stamp = iso.replace(/[:.]/g, '-')

async function main() {
  const baseUrl = (process.env.BASE_URL || process.env.APP_BASE_URL || 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
  const token = process.env.AUTH_TOKEN || process.env.API_AUTH_TOKEN
  if (!token) {
    console.error('AUTH_TOKEN or API_AUTH_TOKEN required')
    process.exit(1)
  }

  const url = new URL(`${baseUrl}/api/v1/voice-agents/analytics`)
  url.searchParams.set('period', process.env.VOICE_PHASE1_PERIOD || 'week')
  if (process.env.VOICE_PHASE1_AGENT_ID) {
    url.searchParams.set('agentId', process.env.VOICE_PHASE1_AGENT_ID)
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  })
  const body = await res.json().catch(() => ({}))

  const outputDir = path.join(process.cwd(), 'docs', 'evidence', 'voice-agent')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${stamp}-phase1-pilot.md`)

  const runtime = body?.analytics?.runtime ?? null
  const lines = [
    '# Voice Agent Phase 1 pilot evidence',
    '',
    `- Captured: ${iso}`,
    `- Analytics URL: ${url.toString()}`,
    `- HTTP status: ${res.status}`,
    '',
    '## Runtime counters',
    '',
    '```json',
    JSON.stringify(runtime, null, 2),
    '```',
    '',
    '## Full analytics payload',
    '',
    '```json',
    JSON.stringify(body?.analytics ?? body, null, 2),
    '```',
    '',
    '## Pilot gate checklist',
    '',
    '- [ ] bolnaFallbackRate < 5% (n >= 10 Bolna attempts)',
    '- [ ] bolnaSilentFailureCount / bolnaInboundAttempts < 2%',
    '- [ ] avgFirstAudioMs p50 < 1000ms (manual from call samples)',
    '- [ ] smoke:voice-agent:bolna-bridge green',
    '',
  ]

  writeFileSync(outputPath, lines.join('\n'), 'utf8')
  console.log(`Wrote ${outputPath}`)
  if (!res.ok) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
