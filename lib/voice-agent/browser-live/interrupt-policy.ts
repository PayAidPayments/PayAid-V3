/**
 * Barge-in / backchannel suppression for browser live voice (client-side).
 */

export type InterruptPolicyConfig = {
  /** Min interim transcript length to count as intentional interrupt. */
  minInterimChars: number
  /** Min confidence proxy: reject single filler words. */
  fillerWords: Set<string>
  /** Cooldown after interrupt before another can fire (ms). */
  cooldownMs: number
}

export const DEFAULT_INTERRUPT_POLICY: InterruptPolicyConfig = {
  minInterimChars: 4,
  fillerWords: new Set(['uh', 'um', 'hmm', 'ah', 'oh', 'ok', 'yeah', 'yes', 'no', 'ha']),
  cooldownMs: 800,
}

export function shouldTriggerBargeIn(
  interimText: string,
  policy: InterruptPolicyConfig = DEFAULT_INTERRUPT_POLICY,
): boolean {
  const t = interimText.trim().toLowerCase()
  if (t.length < policy.minInterimChars) return false
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length === 1 && policy.fillerWords.has(words[0]!)) return false
  return true
}
