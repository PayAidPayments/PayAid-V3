import type { AiSurface } from '@/lib/security/ai-policy'
import type { NormalizedAiInput } from '../types'

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const EXCESS_WHITESPACE = /\s+/g

export function normalizeAiInput(params: {
  raw: string
  surface: AiSurface
  route: string
  channel: NormalizedAiInput['channel']
  metadata?: Record<string, unknown>
}): NormalizedAiInput {
  const normalized = String(params.raw || '')
    .replace(CONTROL_CHARS, ' ')
    .replace(EXCESS_WHITESPACE, ' ')
    .trim()
    .slice(0, 32_000)

  return {
    raw: params.raw,
    normalized,
    surface: params.surface,
    route: params.route,
    channel: params.channel,
    metadata: params.metadata,
  }
}
