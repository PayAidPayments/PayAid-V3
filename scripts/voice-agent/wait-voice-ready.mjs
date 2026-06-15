#!/usr/bin/env node
/**
 * Poll voice app until a route responds (compilation done).
 */
const base = (process.env.VOICE_BASE_URL || 'http://127.0.0.1:3003').replace(/\/$/, '')
const timeoutMs = Number(process.env.VOICE_READY_TIMEOUT_MS || 300_000)
const start = Date.now()

while (Date.now() - start < timeoutMs) {
  try {
    const res = await fetch(`${base}/voice-agents`, {
      signal: AbortSignal.timeout(15_000),
    })
    if (res.status < 500) {
      console.log(JSON.stringify({ ok: true, status: res.status, waitedMs: Date.now() - start }))
      process.exit(0)
    }
  } catch {
    /* retry */
  }
  await new Promise((r) => setTimeout(r, 5000))
}

console.error(JSON.stringify({ ok: false, error: 'voice not ready', timeoutMs }))
process.exit(1)
