/**
 * Coqui TTS Docker — self-hosted, no API keys, no 401s.
 * Use when COQUI_TTS_URL is set (e.g. http://localhost:5002/api/tts).
 *
 * Docker: docker run -d --name payaid-tts -p 5002:5002 ghcr.io/coqui-ai/tts-cpu:latest
 * .env: COQUI_TTS_URL=http://localhost:5002/api/tts
 *
 * XTTS-v2: Hindi, English, multilingual. No auth.
 */

function getCoquiUrl(): string | undefined {
  const u = process.env.COQUI_TTS_URL?.trim()
  return u || undefined
}

export function isCoquiDockerConfigured(): boolean {
  return !!getCoquiUrl()
}

/**
 * Synthesize speech using Coqui TTS Docker or PayAid TTS (e.g. localhost:7861/synthesize).
 * Supports: (1) POST with { text, language, speaker_wav } → raw/binary or JSON audio
 *           (2) PayAid /synthesize with { text, language, voice, speed } → audio_base64
 */
export async function synthesizeWithCoquiDocker(
  text: string,
  language: string,
  voiceId?: string,
  speed: number = 1.0
): Promise<Buffer> {
  const url = getCoquiUrl()
  if (!url) {
    throw new Error('COQUI_TTS_URL is not set')
  }

  const langCode = language.split('-')[0] || 'en'
  const isPayAidSynthesize = url.endsWith('/synthesize')

  const body = isPayAidSynthesize
    ? { text, language: langCode, voice: voiceId || '', speed }
    : { text, language: langCode, speaker_wav: null }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000) // 10s max per request
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(timeoutId)
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('abort') || msg.includes('timeout')) {
      throw new Error('Coqui TTS timeout. Is the container running? See docs/TTS_TROUBLESHOOTING.md')
    }
    throw new Error(`Coqui TTS unreachable (${msg}). Is COQUI_TTS_URL correct and container running? See docs/TTS_TROUBLESHOOTING.md`)
  }
  clearTimeout(timeoutId)

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Coqui TTS failed (${res.status}): ${errText}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const json = (await res.json()) as { audio?: string; audio_base64?: string }
    const b64 = json.audio_base64 ?? json.audio
    if (b64) return Buffer.from(b64, 'base64')
    throw new Error('Coqui TTS response had no audio field')
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
