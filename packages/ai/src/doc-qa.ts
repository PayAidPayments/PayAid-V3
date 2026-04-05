/**
 * Document QA: answers from caller-supplied context only (RAG retrieval stays outside this package).
 */

import { generateText } from './text'

export interface QaDocInput {
  question: string
  /** Chunk or full document text (truncate in caller if needed). */
  context: string
  system?: string
}

const DEFAULT_SYSTEM = `You answer using ONLY the provided context. If the answer is not contained in the context, respond exactly: "I do not have enough information in the provided document."
Be concise. For Indian SMB marketing, prefer clear English; use Hindi only if the question is in Hindi.`

export async function qaDoc(input: QaDocInput): Promise<string> {
  const ctx = input.context.trim()
  if (!ctx) throw new Error('context is required')
  const q = input.question.trim()
  if (!q) throw new Error('question is required')

  const prompt = `Context:
---
${ctx.slice(0, 28000)}
---

Question: ${q}`

  return generateText({
    prompt,
    system: input.system?.trim() || DEFAULT_SYSTEM,
    maxTokens: 1024,
  })
}
