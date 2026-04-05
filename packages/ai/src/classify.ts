/**
 * Zero-shot (and simple multi-label) text classification via the same LLM as generateText.
 * No separate HF classifier models — keeps infra minimal for Marketing v1.
 */

import { generateText } from './text'

export interface ClassifyTextInput {
  text: string
  /** Candidate labels; the model must pick from this list (case-sensitive match after normalize). */
  labels: string[]
  /** If true, return multiple applicable labels. */
  multiLabel?: boolean
}

function extractJsonObject(raw: string): Record<string, unknown> {
  const t = raw.trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('Classifier did not return JSON')
  return JSON.parse(t.slice(start, end + 1)) as Record<string, unknown>
}

function normalizeLabel(s: string): string {
  return s.trim().toLowerCase()
}

/**
 * Classify `text` into one of `labels` (or several if multiLabel).
 */
export async function classifyText(input: ClassifyTextInput): Promise<{
  label?: string
  labels?: string[]
  confidenceNote?: string
}> {
  const labels = input.labels.map((l) => l.trim()).filter(Boolean)
  if (!labels.length) throw new Error('At least one label is required')
  if (!input.text?.trim()) throw new Error('Text is required')

  const system =
    'You are a precise classifier for marketing and CRM text. Reply with JSON only, no markdown fences.'

  const prompt = input.multiLabel
    ? `Labels (use only these strings exactly as given): ${JSON.stringify(labels)}
Text to classify:
---
${input.text}
---
Return JSON: {"labels": ["label1", ...], "note": "optional short reason" }
Use only labels from the list; omit labels that do not apply.`
    : `Labels (pick exactly one string from this list, copied exactly): ${JSON.stringify(labels)}
Text to classify:
---
${input.text}
---
Return JSON: {"label": "<one label from the list>", "note": "optional short reason" }`

  const raw = await generateText({ prompt, system, maxTokens: 256 })
  const obj = extractJsonObject(raw)

  if (input.multiLabel) {
    const arr = obj.labels
    const picked = Array.isArray(arr)
      ? arr.filter((x): x is string => typeof x === 'string')
      : []
    const allowed = new Map(labels.map((l) => [normalizeLabel(l), l]))
    const normalized = picked
      .map((p) => allowed.get(normalizeLabel(p)))
      .filter((x): x is string => Boolean(x))
    const unique = [...new Set(normalized)]
    return {
      labels: unique,
      confidenceNote: typeof obj.note === 'string' ? obj.note : undefined,
    }
  }

  const one = obj.label
  if (typeof one !== 'string') throw new Error('Classifier JSON missing label')
  const allowed = new Map(labels.map((l) => [normalizeLabel(l), l]))
  const canonical = allowed.get(normalizeLabel(one))
  if (!canonical) {
    return {
      label: labels[0],
      confidenceNote: `Model returned "${one}"; fell back to first label.`,
    }
  }
  return {
    label: canonical,
    confidenceNote: typeof obj.note === 'string' ? obj.note : undefined,
  }
}
