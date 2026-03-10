/**
 * Coqui TTS provider (Docker or PayAid /synthesize). Env: COQUI_TTS_URL (required).
 */
function getUrl(): string {
  const u = process.env.COQUI_TTS_URL?.trim()
  if (!u) throw new Error('COQUI_TTS_URL not set')
  return u
}

export default async function coqui(text: string, lang: string = 'hi'): Promise<Buffer> {
  const url = getUrl()
  const langCode = lang.split('-')[0] || 'en'
  const isPayAid = url.endsWith('/synthesize')
  const body = isPayAid
    ? { text, language: langCode, voice: '', speed: 1 }
    : { text, language: langCode, speaker_wav: null }
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 8000)
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(t)
  }
  if (!res.ok) throw new Error(`Coqui TTS ${res.status}: ${await res.text()}`)
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const json = (await res.json()) as { audio_base64?: string; audio?: string }
    const b64 = json.audio_base64 ?? json.audio
    if (b64) return Buffer.from(b64, 'base64')
    throw new Error('Coqui TTS response had no audio')
  }
  return Buffer.from(await res.arrayBuffer())
}
