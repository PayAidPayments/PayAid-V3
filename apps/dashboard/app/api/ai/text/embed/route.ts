import { NextRequest, NextResponse } from 'next/server'
import { requireCanonicalAiGatewayAccess, handleLicenseError } from '@/lib/middleware/auth'
import { embedText, embedTexts, rankTextsBySimilarity } from '@payaid/ai'
import { z } from 'zod'

const singleSchema = z.object({
  text: z.string().min(1).max(32000),
})

const batchSchema = z.object({
  texts: z.array(z.string().min(1)).min(1).max(128),
})

const rankSchema = z.object({
  query: z.string().min(1).max(32000),
  documents: z.array(z.string()).min(1).max(200),
  topK: z.number().min(1).max(50).optional(),
})

/**
 * POST /api/ai/text/embed
 * - Body `{ text }` → `{ embedding: number[] }`
 * - Body `{ texts }` → `{ embeddings: number[][] }` (batch)
 * - Body `{ query, documents, topK? }` → `{ ranked: { index, score }[] }`
 */
export async function POST(request: NextRequest) {
  try {
    await requireCanonicalAiGatewayAccess(request)
    const body = await request.json()

    const batchParsed = batchSchema.safeParse(body)
    if (batchParsed.success) {
      const embeddings = await embedTexts(batchParsed.data.texts)
      return NextResponse.json({ embeddings })
    }

    const rankParsed = rankSchema.safeParse(body)
    if (rankParsed.success) {
      const { query, documents, topK } = rankParsed.data
      const ranked = await rankTextsBySimilarity(query, documents, topK ?? 10)
      return NextResponse.json({ ranked })
    }

    const singleParsed = singleSchema.safeParse(body)
    if (singleParsed.success) {
      const embedding = await embedText(singleParsed.data.text)
      return NextResponse.json({ embedding })
    }

    return NextResponse.json(
      {
        error: 'Invalid input',
        message: 'Send { text }, { texts }, or { query, documents } for ranking.',
      },
      { status: 400 }
    )
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    console.error('/api/ai/text/embed error:', err)
    const message = err instanceof Error ? err.message : 'Embedding failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
