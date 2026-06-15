/**
 * Tenant bridge: KB search.
 *
 * Bolna calls this mid-turn to fetch relevant knowledge-base chunks before
 * the LLM responds. We stay the source of truth for vectors / embeddings —
 * Bolna never sees the underlying KB.
 *
 * Auth: shared bridge secret + per-call JWT (see lib/voice-agent/runtime/bridge-auth.ts).
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchKnowledgeBase } from '@/lib/voice-agent/knowledge-base'
import { authenticateBolnaBridge } from '@/lib/voice-agent/runtime/bridge-auth'

export const runtime = 'nodejs'

interface KbSearchBody {
  query?: string
  topK?: number
}

export async function POST(request: NextRequest) {
  const auth = authenticateBolnaBridge(request.headers)
  if (!auth.ok) return auth.response

  const body = (await request.json().catch(() => ({}))) as KbSearchBody
  const query = (body.query || '').trim()
  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const topK = Math.min(Math.max(body.topK ?? 3, 1), 5)

  try {
    const results = await searchKnowledgeBase(auth.claims.agentId, query, topK)
    return NextResponse.json({
      ok: true,
      results: results.map((r) => ({
        id: r.id,
        content: r.content,
        metadata: r.metadata,
        score: r.score,
      })),
    })
  } catch (error) {
    console.error('[runtime/bolna/kb] search failed:', error)
    return NextResponse.json(
      {
        ok: false,
        results: [],
        detail: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 200 }, // Don't break the call — empty results are fine.
    )
  }
}
