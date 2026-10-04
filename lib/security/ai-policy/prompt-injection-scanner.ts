/**
 * Heuristic prompt-injection and RAG-poisoning scanner.
 * Complements (does not replace) authz and typed-action enforcement.
 */

export interface InjectionScanResult {
  riskScore: number
  flags: string[]
  sanitizedText: string
  redactions: string[]
  blocked: boolean
}

const INJECTION_PATTERNS: Array<{ id: string; pattern: RegExp; weight: number }> = [
  { id: 'ignore_instructions', pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i, weight: 0.45 },
  { id: 'disregard_policy', pattern: /disregard\s+(your\s+)?(policy|rules|guidelines|safety)/i, weight: 0.45 },
  { id: 'reveal_system_prompt', pattern: /(reveal|show|print|dump|output)\s+(your\s+)?(system\s+prompt|hidden\s+instructions|developer\s+message)/i, weight: 0.5 },
  { id: 'role_override', pattern: /\b(you are now|act as|pretend to be)\s+(root|admin|system|developer)\b/i, weight: 0.4 },
  { id: 'tool_exfil', pattern: /(call|invoke|run)\s+(all\s+)?tools|exfiltrat(e|ion)|dump\s+(database|secrets|env)/i, weight: 0.45 },
  { id: 'delimiter_injection', pattern: /<\s*\/?\s*(system|assistant|tool|function)\s*>/i, weight: 0.35 },
  { id: 'jailbreak_phrase', pattern: /\b(DAN|do anything now|jailbreak|bypass\s+safety)\b/i, weight: 0.4 },
]

const SECRET_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: 'api_key_like', pattern: /\b(sk-[a-zA-Z0-9]{10,}|AKIA[0-9A-Z]{16}|Bearer\s+[a-zA-Z0-9._-]{20,})\b/g },
  { id: 'private_key_block', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/g },
]

const BLOCK_THRESHOLD = Number(process.env.AI_INJECTION_BLOCK_THRESHOLD || '0.85')
const WARN_THRESHOLD = Number(process.env.AI_INJECTION_WARN_THRESHOLD || '0.55')

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

export function scanForPromptInjection(text: string, options?: { strict?: boolean }): InjectionScanResult {
  const input = String(text || '')
  const flags: string[] = []
  let riskScore = 0

  for (const rule of INJECTION_PATTERNS) {
    if (rule.pattern.test(input)) {
      flags.push(rule.id)
      riskScore += rule.weight
    }
  }

  let sanitizedText = input
  const redactions: string[] = []

  for (const secret of SECRET_PATTERNS) {
    if (secret.pattern.test(sanitizedText)) {
      flags.push(secret.id)
      redactions.push(secret.id)
      riskScore += 0.25
      sanitizedText = sanitizedText.replace(secret.pattern, '[REDACTED_SECRET]')
    }
  }

  riskScore = clamp01(riskScore)
  const strict = options?.strict ?? process.env.AI_INJECTION_STRICT === '1'
  const blocked = strict ? riskScore >= WARN_THRESHOLD : riskScore >= BLOCK_THRESHOLD

  return {
    riskScore,
    flags: [...new Set(flags)],
    sanitizedText: sanitizedText.trim(),
    redactions: [...new Set(redactions)],
    blocked,
  }
}

export function scanRetrievedChunks(chunks: string[]): InjectionScanResult {
  const combined = chunks.join('\n---\n')
  return scanForPromptInjection(combined, { strict: true })
}
