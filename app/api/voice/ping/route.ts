/**
 * POST /api/voice/ping
 * Pre-warm Groq so the first voice demo reply is fast (no cold-start).
 */
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { getGroqClient } from '@/lib/ai/groq'
import { isGroqConfigured } from '@/lib/voice-agent/llm'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    if (!isGroqConfigured()) {
      return NextResponse.json({ ok: false }, { status: 200 })
    }
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 2000)
    try {
      const groq = getGroqClient()
      await groq.chat(
        [{ role: 'system', content: 'Say only OK.' }, { role: 'user', content: 'Ping.' }],
        { maxTokens: 5, signal: controller.signal }
      )
    } finally {
      clearTimeout(t)
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
