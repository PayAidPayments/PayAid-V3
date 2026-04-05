/**
 * Text embeddings for RAG / similarity (self-hosted bge-m3, jina, etc.).
 * Expects POST JSON { "input": "text" } → { "embedding": number[] } or OpenAI-style { data: [{ embedding }] }.
 */

import { getEmbeddingUrl } from './config'

export async function embedText(text: string): Promise<number[]> {
  const base = getEmbeddingUrl()
  if (!base) {
    throw new Error('Embeddings not configured. Set EMBEDDING_URL.')
  }

  const res = await fetch(`${base}/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: text }),
  })

  if (!res.ok) {
    const t = await res.text().catch(() => res.statusText)
    throw new Error(`Embeddings ${res.status}: ${t.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    embedding?: number[]
    data?: Array<{ embedding?: number[] }>
  }

  if (data.embedding?.length) return data.embedding
  const e = data.data?.[0]?.embedding
  if (e?.length) return e

  throw new Error('Embeddings response missing embedding array')
}

/** Batch embeddings (parallel calls; same contract as single `embedText`). */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return []
  return Promise.all(texts.map((t) => embedText(t)))
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const d = Math.sqrt(na) * Math.sqrt(nb)
  return d === 0 ? 0 : dot / d
}

/**
 * Embed `query` and each candidate; return top indices by cosine similarity.
 * Sequential calls — fine for small lists (e.g. Library snippets); batch later if needed.
 */
export async function rankTextsBySimilarity(
  query: string,
  candidates: string[],
  topK = 10
): Promise<Array<{ index: number; score: number }>> {
  if (!query.trim()) throw new Error('query is required')
  const qVec = await embedText(query)
  const scores: Array<{ index: number; score: number }> = []
  for (let i = 0; i < candidates.length; i++) {
    const t = candidates[i]?.trim()
    if (!t) {
      scores.push({ index: i, score: 0 })
      continue
    }
    const v = await embedText(t)
    scores.push({ index: i, score: cosineSimilarity(qVec, v) })
  }
  scores.sort((x, y) => y.score - x.score)
  return scores.slice(0, Math.min(topK, scores.length))
}
