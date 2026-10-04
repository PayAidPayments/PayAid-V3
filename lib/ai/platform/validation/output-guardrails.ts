/**
 * Layer 6 — output guardrails (post-model, pre-response).
 */

import { scanForPromptInjection } from '@/lib/security/ai-policy/prompt-injection-scanner'

const PII_PATTERNS = [
  { id: 'email', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { id: 'phone', pattern: /\b\+?\d[\d\s-]{8,}\d\b/g },
]

export interface OutputGuardrailResult {
  allowed: boolean
  sanitizedOutput: string
  flags: string[]
  redactions: string[]
}

export function applyOutputGuardrails(output: string, options?: { strict?: boolean }): OutputGuardrailResult {
  let sanitized = String(output || '')
  const flags: string[] = []
  const redactions: string[] = []

  const injection = scanForPromptInjection(sanitized)
  if (injection.flags.length) {
    flags.push(...injection.flags.map((f) => `output:${f}`))
  }

  for (const pii of PII_PATTERNS) {
    if (pii.pattern.test(sanitized)) {
      flags.push(`pii:${pii.id}`)
      redactions.push(pii.id)
      sanitized = sanitized.replace(pii.pattern, `[REDACTED_${pii.id.toUpperCase()}]`)
    }
  }

  const blocked = options?.strict
    ? flags.length > 0
    : injection.blocked || flags.some((f) => f.startsWith('output:ignore'))

  return {
    allowed: !blocked,
    sanitizedOutput: sanitized.trim(),
    flags: [...new Set(flags)],
    redactions: [...new Set(redactions)],
  }
}
