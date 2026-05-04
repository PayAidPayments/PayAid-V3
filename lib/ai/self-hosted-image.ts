/**
 * Self-hosted image generator (Stable Diffusion XL or compatible worker).
 * No tenant API key or quota limits — runs on your own infrastructure.
 *
 * Set IMAGE_WORKER_URL (e.g. http://localhost:7860 or http://image-worker:8000)
 * to use your own text-to-image service. Compatible with services/text-to-image/server.py.
 */

function getImageWorkerUrl(): string {
  return (process.env.IMAGE_WORKER_URL || process.env.TEXT_TO_IMAGE_SERVICE_URL || '').trim()
}

export function isSelfHostedImageAvailable(): boolean {
  return Boolean(getImageWorkerUrl())
}

export interface SelfHostedGenerateOptions {
  prompt: string
  style?: string
  size?: string
}

export interface SelfHostedGenerateResult {
  imageUrl: string
  revisedPrompt: string
  generationTime?: number
}

/** Call self-hosted POST /generate; returns null on failure or when service not configured. */
export async function generateSelfHostedImage(
  options: SelfHostedGenerateOptions
): Promise<SelfHostedGenerateResult | null> {
  const baseUrl = getImageWorkerUrl().replace(/\/$/, '')
  if (!baseUrl) return null

  const { prompt, style = 'realistic', size = '1024x1024' } = options
  const body = {
    prompt: prompt.trim(),
    style,
    size: size.includes('x') ? size : '1024x1024',
    num_inference_steps: 30,
    guidance_scale: 7.5,
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120_000) // 2 min for GPU
    const response = await fetch(`${baseUrl}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      const err = await response.text()
      console.warn('Self-hosted image worker error:', response.status, err)
      return null
    }

    const data = (await response.json()) as {
      image_url?: string
      revised_prompt?: string
      generation_time?: number
    }
    const imageUrl = data.image_url
    if (!imageUrl) {
      console.warn('Self-hosted image worker returned no image_url')
      return null
    }
    return {
      imageUrl,
      revisedPrompt: data.revised_prompt ?? prompt,
      generationTime: data.generation_time,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg !== 'The operation was aborted') {
      console.warn('Self-hosted image worker request failed:', msg)
    }
    return null
  }
}

/** Quick health check (GET /health). */
export async function checkSelfHostedImageHealth(): Promise<boolean> {
  const baseUrl = getImageWorkerUrl().replace(/\/$/, '')
  if (!baseUrl) return false
  try {
    const res = await fetch(`${baseUrl}/health`, { method: 'GET' })
    if (!res.ok) return false
    const data = (await res.json()) as { status?: string }
    return data.status === 'healthy'
  } catch {
    return false
  }
}
