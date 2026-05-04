import type { ImageProvider } from '@/lib/ai/generation/contracts'

export type ImageGenerationCapabilities = {
  selfHosted: boolean
  googleAiStudio: boolean
  huggingFace: boolean
  nanoBanana: boolean
}

export function normalizeImageProvider(value: unknown): ImageProvider {
  if (typeof value !== 'string') return 'auto'
  const v = value.trim().toLowerCase()
  if (
    v === 'auto' ||
    v === 'self-hosted' ||
    v === 'google-ai-studio' ||
    v === 'huggingface' ||
    v === 'nanobanana'
  ) {
    return v
  }
  return 'auto'
}

export function getImageProviderPlan(
  provider: ImageProvider,
  capabilities: ImageGenerationCapabilities
): ImageProvider[] {
  if (provider !== 'auto') return [provider]

  const plan: ImageProvider[] = []
  if (capabilities.selfHosted) plan.push('self-hosted')
  if (capabilities.googleAiStudio) plan.push('google-ai-studio')
  if (capabilities.huggingFace) plan.push('huggingface')
  if (capabilities.nanoBanana) plan.push('nanobanana')
  return plan
}
