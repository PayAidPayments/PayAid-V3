/**
 * @payaid/ai – TTS with multi-provider fallback (Phase 6).
 * Order: vexyl → sarvam → coqui. Returns audio or text-only when all fail.
 */

type Provider = (text: string, lang: string) => Promise<Buffer>
const PROVIDER_LOADERS: Array<{ name: string; load: () => Promise<{ default: Provider }> }> = [
  { name: 'vexyl', load: () => import('./providers/vexyl') },
  { name: 'sarvam', load: () => import('./providers/sarvam') },
  { name: 'coqui', load: () => import('./providers/coqui') },
]

export interface TTSResult {
  audio: Buffer | null
  text: string
  provider?: string
}

export async function generateTTS(
  text: string,
  lang: string = 'hi'
): Promise<TTSResult> {
  for (const { name, load } of PROVIDER_LOADERS) {
    try {
      const mod = await load()
      const audio = await mod.default(text, lang)
      return { audio, text, provider: name }
    } catch (e) {
      console.warn(`[TTS] ${name} fail:`, e instanceof Error ? e.message : e)
    }
  }
  return { audio: null, text }
}

/** Legacy export: throws if no provider succeeds (use generateTTS for resilient text-mode fallback). */
export async function tts(text: string, lang: string = 'hi'): Promise<Buffer> {
  const result = await generateTTS(text, lang)
  if (result.audio) return result.audio
  throw new Error('TTS not configured: use text mode. Set VEXYL_TTS_URL, SARVAM_API_KEY, or COQUI_TTS_URL.')
}

export const AI_PACKAGE = '@payaid/ai'
