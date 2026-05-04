import { getHuggingFaceClient } from '@/lib/ai/huggingface'
import { getNanoBananaClient } from '@/lib/ai/nanobanana'
import { generateSelfHostedImage, isSelfHostedImageAvailable } from '@/lib/ai/self-hosted-image'
import type { ImageProvider } from '@/lib/ai/generation/contracts'
import { getImageProviderPlan } from '@/lib/ai/generation/provider-plan'

export type ImageAttemptInput = {
  prompt: string
  style?: string
  size?: string
}

export type ImageOrchestratorContext = {
  provider: ImageProvider
  authHeader: string
  tenantHasGoogleAiStudio: boolean
}

export type ImageAttemptSuccess = {
  ok: true
  provider: ImageProvider
  payload: Record<string, unknown>
}

export type ImageAttemptFailure = {
  ok: false
  provider: ImageProvider
  error: string
  hint?: string
  status?: number
  details?: unknown
}

export type ImageAttemptResult = ImageAttemptSuccess | ImageAttemptFailure

function isImageAttemptFailure(result: ImageAttemptResult): result is ImageAttemptFailure {
  return !result.ok
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

async function trySelfHosted(input: ImageAttemptInput): Promise<ImageAttemptResult> {
  if (!isSelfHostedImageAvailable()) {
    return {
      ok: false,
      provider: 'self-hosted',
      error: 'Self-hosted image service unavailable',
      hint: 'Set IMAGE_WORKER_URL and run services/text-to-image.',
      status: 503,
    }
  }
  const result = await generateSelfHostedImage(input)
  if (!result) {
    return {
      ok: false,
      provider: 'self-hosted',
      error: 'Self-hosted image service unavailable',
      hint: 'The image worker did not return an image. Check IMAGE_WORKER_URL and /generate.',
      status: 503,
    }
  }
  return {
    ok: true,
    provider: 'self-hosted',
    payload: {
      imageUrl: result.imageUrl,
      revisedPrompt: result.revisedPrompt,
      service: 'self-hosted',
      generationTime: result.generationTime,
    },
  }
}

async function tryGoogleAiStudio(
  input: ImageAttemptInput,
  authHeader: string
): Promise<ImageAttemptResult> {
  try {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000'
    const googleResponse = await fetch(`${baseUrl}/api/ai/google-ai-studio/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(input),
    })
    const data = await googleResponse.json().catch(() => ({}))
    if (!googleResponse.ok) {
      return {
        ok: false,
        provider: 'google-ai-studio',
        error: data.error?.message || data.message || `API returned ${googleResponse.status}`,
        hint: data.hint || 'Check Google AI Studio key in Settings > AI Integrations.',
        status: googleResponse.status,
        details: data,
      }
    }
    return { ok: true, provider: 'google-ai-studio', payload: data }
  } catch (error) {
    return {
      ok: false,
      provider: 'google-ai-studio',
      error: toErrorMessage(error),
      hint: 'Google AI Studio request failed.',
      status: 500,
      details: error instanceof Error ? { name: error.name, stack: error.stack } : error,
    }
  }
}

async function tryHuggingFace(input: ImageAttemptInput): Promise<ImageAttemptResult> {
  const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY
  if (!huggingFaceApiKey) {
    return {
      ok: false,
      provider: 'huggingface',
      error: 'Hugging Face Inference API key not configured',
      hint: 'Set HUGGINGFACE_API_KEY in server environment.',
      status: 503,
    }
  }
  try {
    const huggingFace = getHuggingFaceClient()
    const result = await huggingFace.textToImage(input)
    return {
      ok: true,
      provider: 'huggingface',
      payload: {
        imageUrl: result.image_url,
        revisedPrompt: result.revised_prompt,
        service: result.service,
      },
    }
  } catch (error) {
    return {
      ok: false,
      provider: 'huggingface',
      error: toErrorMessage(error),
      hint: 'Verify HUGGINGFACE_API_KEY and HUGGINGFACE_IMAGE_MODEL.',
      status: 500,
      details: error,
    }
  }
}

async function tryNanoBanana(input: ImageAttemptInput): Promise<ImageAttemptResult> {
  const nanoBanana = getNanoBananaClient()
  if (!nanoBanana.isAvailable()) {
    return {
      ok: false,
      provider: 'nanobanana',
      error: 'Nano Banana service not configured',
      hint: 'Set GEMINI_API_KEY in server environment.',
      status: 503,
    }
  }
  try {
    const result = await nanoBanana.generateImage(input)
    return {
      ok: true,
      provider: 'nanobanana',
      payload: {
        imageUrl: result.image_url,
        revisedPrompt: result.revised_prompt,
        service: result.service,
        processingTimeMs: result.processingTimeMs,
        costInINR: result.costInINR,
      },
    }
  } catch (error) {
    return {
      ok: false,
      provider: 'nanobanana',
      error: toErrorMessage(error),
      hint: 'Verify GEMINI_API_KEY and quota.',
      status: 500,
      details: error,
    }
  }
}

export async function orchestrateImageGeneration(
  context: ImageOrchestratorContext,
  input: ImageAttemptInput
): Promise<{ success?: ImageAttemptSuccess; failures: ImageAttemptFailure[]; plan: ImageProvider[] }> {
  const plan = getImageProviderPlan(context.provider, {
    selfHosted: isSelfHostedImageAvailable(),
    googleAiStudio: context.tenantHasGoogleAiStudio,
    huggingFace: Boolean(process.env.HUGGINGFACE_API_KEY),
    nanoBanana: getNanoBananaClient().isAvailable(),
  })

  if (context.provider !== 'auto' && plan.length === 0) {
    plan.push(context.provider)
  }

  const failures: ImageAttemptFailure[] = []
  for (const provider of plan) {
    let result: ImageAttemptResult
    if (provider === 'self-hosted') {
      result = await trySelfHosted(input)
    } else if (provider === 'google-ai-studio') {
      result = await tryGoogleAiStudio(input, context.authHeader)
    } else if (provider === 'huggingface') {
      result = await tryHuggingFace(input)
    } else {
      result = await tryNanoBanana(input)
    }
    if (result.ok) return { success: result, failures, plan }
    if (isImageAttemptFailure(result)) {
      failures.push(result)
    }
  }

  return { failures, plan }
}
