/**
 * Self-hosted-first env resolution (aliases for legacy PayAid names).
 * Server-side only; no secrets logged.
 */

export function getOllamaBaseUrl(): string {
  return (
    process.env.OLLAMA_URL?.trim() ||
    process.env.OLLAMA_BASE_URL?.trim() ||
    'http://localhost:11434'
  ).replace(/\/$/, '')
}

export function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL?.trim() || 'llama3.1:8b'
}

export function getComfyUiBaseUrl(): string | null {
  const u = process.env.COMFYUI_URL?.trim()
  return u ? u.replace(/\/$/, '') : null
}

export function isComfyUiEnabled(): boolean {
  // Default OFF to keep CPU-only environments stable.
  return (process.env.USE_COMFYUI?.trim().toLowerCase() === 'true')
}

export function getImageWorkerUrl(): string | null {
  const u =
    process.env.IMAGE_WORKER_URL?.trim() ||
    process.env.TEXT_TO_IMAGE_SERVICE_URL?.trim()
  return u ? u.replace(/\/$/, '') : null
}

export function getA1111BaseUrl(): string | null {
  const u =
    process.env.A1111_URL?.trim() ||
    process.env.AUTOMATIC1111_URL?.trim() ||
    process.env.STABLE_DIFFUSION_WEBUI_URL?.trim()
  return u ? u.replace(/\/$/, '') : null
}

/**
 * Optional auth for A1111 when exposed behind a gateway.
 * Prefer a reverse proxy with access control over exposing A1111 directly.
 */
export function getA1111ApiKey(): string | null {
  const k = process.env.A1111_API_KEY?.trim()
  return k || null
}

/** Hugging Face Inference API key (server env only). */
export function getHuggingFaceApiKey(): string | null {
  const k = process.env.HUGGINGFACE_API_KEY?.trim()
  return k || null
}

export function getHuggingFaceImageModel(): string {
  return (
    process.env.HUGGINGFACE_IMAGE_MODEL?.trim() ||
      // Full SDXL pipeline on Inference API (ByteDance/SDXL-Lightning is LoRA-focused and returns 404 on hf-inference).
      'stabilityai/stable-diffusion-xl-base-1.0'
  )
}

/**
 * Image generation routing for Marketing /api/ai/image/generate:
 * - `huggingface` — Inference API only
 * - `worker` — self-hosted IMAGE_WORKER_URL only
 * - `comfy` — ComfyUI only (USE_COMFYUI=true)
 * - `a1111` — Automatic1111 WebUI (A1111) only
 * - `auto` — try Hugging Face if HUGGINGFACE_API_KEY is set, else A1111, else worker, else ComfyUI
 */
export function getAiImageProvider(): 'huggingface' | 'a1111' | 'worker' | 'comfy' | 'auto' {
  const v = process.env.AI_IMAGE_PROVIDER?.trim().toLowerCase()
  if (v === 'huggingface' || v === 'hf' || v === 'huggingface-api') return 'huggingface'
  if (v === 'a1111' || v === 'automatic1111' || v === 'sd-webui') return 'a1111'
  if (v === 'worker' || v === 'self-hosted' || v === 'local') return 'worker'
  if (v === 'comfy' || v === 'comfyui') return 'comfy'
  return 'auto'
}

export function getAiGatewayUrl(): string | null {
  const u =
    process.env.AI_GATEWAY_URL?.trim() ||
    process.env.NEXT_PUBLIC_AI_GATEWAY_URL?.trim()
  return u ? u.replace(/\/$/, '') : null
}

export function getWhisperOrSttUrl(): string | null {
  return (
    process.env.WHISPER_URL?.trim() ||
    process.env.SPEECH_TO_TEXT_URL?.trim() ||
    null
  )?.replace(/\/$/, '') || null
}

export function getTtsUrl(): string | null {
  return process.env.TTS_URL?.trim()?.replace(/\/$/, '') || null
}

export function getEmbeddingUrl(): string | null {
  return process.env.EMBEDDING_URL?.trim()?.replace(/\/$/, '') || null
}

export function getVideoQueueUrl(): string | null {
  return process.env.AI_VIDEO_QUEUE_URL?.trim()?.replace(/\/$/, '') || null
}

/** Sent as `x-payaid-video-queue-secret` when calling the video queue worker (must match server env). */
export function getVideoQueueSecret(): string | null {
  const s = process.env.AI_VIDEO_QUEUE_SECRET?.trim()
  return s || null
}
