/** Shared AI media / job results for @payaid/ai */

export interface MediaResult {
  url: string
  width?: number
  height?: number
  durationSec?: number
  mimeType?: string
}

export interface ImageGenMeta {
  provider: 'comfyui' | 'image-worker' | 'huggingface' | 'a1111' | 'none'
  revisedPrompt?: string
  generationTimeMs?: number
}

export interface VideoJobResult {
  /** `completed` = synchronous worker returned a playable URL (e.g. local ffmpeg worker). */
  status: 'queued' | 'completed' | 'unconfigured' | 'error'
  jobId?: string
  message?: string
  result?: MediaResult
}

/** Optional advanced options forwarded to dynamic video workers (AnimateDiff/SVD/Kling-style backends). */
export interface VideoWorkerOptions {
  script?: string
  scenePlan?: string
  voiceoverText?: string
  referenceAudioUrl?: string
  lipSync?: boolean
  shotCount?: number
  fps?: number
  seed?: number
}
