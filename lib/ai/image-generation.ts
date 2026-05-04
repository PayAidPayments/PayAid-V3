/**
 * Image Generation Helper
 * Wraps existing image generation API for logo generation
 */

/** Thrown when `/api/ai/generate-image` returns a non-OK response; preserves HTTP status and body for callers. */
export class ImageGenerationFailed extends Error {
  readonly statusCode: number
  /** Raw JSON body from generate-image when available (e.g. `setupInstructions`). */
  readonly remoteBody: Record<string, unknown>

  constructor(message: string, statusCode: number, remoteBody: Record<string, unknown> = {}) {
    super(message)
    this.name = 'ImageGenerationFailed'
    this.statusCode = statusCode
    this.remoteBody = remoteBody
  }
}

function buildClientMessageFromRemoteError(status: number, errorData: Record<string, unknown>): string {
  const lines: string[] = []

  const msg = errorData.message
  if (typeof msg === 'string' && msg.trim()) lines.push(msg.trim())

  const topError = errorData.error
  if (typeof topError === 'string' && topError.trim() && topError !== msg) lines.push(topError.trim())

  const hint = errorData.hint
  if (typeof hint === 'string' && hint.trim()) lines.push(hint.trim())

  if (errorData.setupInstructions && typeof errorData.setupInstructions === 'object') {
    lines.push(
      '\nConfigure at least one image provider for the dashboard server:\n' +
        '• Server env: GEMINI_API_KEY and/or HUGGINGFACE_API_KEY, or IMAGE_WORKER_URL (self-hosted worker)\n' +
        '• Or tenant: Settings → AI Integrations → Google AI Studio API key (stored per tenant)\n' +
        '• Restart the Next.js server after changing .env'
    )
  }

  if (lines.length === 0) {
    return `Image generation failed (HTTP ${status}).`
  }

  return lines.join('\n\n')
}

export async function generateImage(params: {
  prompt: string
  size?: string
  tenantId: string
  token?: string
}): Promise<{ url: string }> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (params.token) {
    headers['Authorization'] = `Bearer ${params.token}`
  }

  const response = await fetch(`${baseUrl}/api/ai/generate-image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: params.prompt,
      size: params.size || '1024x1024',
    }),
  })

  if (!response.ok) {
    let errorData: Record<string, unknown> = {}
    try {
      errorData = (await response.json()) as Record<string, unknown>
    } catch {
      throw new ImageGenerationFailed(
        `Image generation failed with status ${response.status}: ${response.statusText}`,
        response.status,
        {}
      )
    }

    const message = buildClientMessageFromRemoteError(response.status, errorData)
    throw new ImageGenerationFailed(message, response.status, errorData)
  }

  const data = await response.json()
  return {
    url: data.url || data.imageUrl || data.image?.url || '',
  }
}
