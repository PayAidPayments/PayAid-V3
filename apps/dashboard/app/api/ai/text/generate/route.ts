import { NextRequest, NextResponse } from 'next/server'
import { requireCanonicalAiGatewayAccess, handleLicenseError } from '@/lib/middleware/auth'
import { generateText } from '@payaid/ai'
import { aiRouteTimer } from '@/lib/ai/ai-route-log'
import { z } from 'zod'

const bodySchema = z.object({
  prompt: z.string().min(1).max(32000),
  system: z.string().max(8000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(64).max(8192).optional(),
})

/**
 * POST /api/ai/text/generate — canonical text generation (Ollama + optional Groq).
 * Marketing / Studio / Playbooks / Social helpers.
 */
export async function POST(request: NextRequest) {
  const timer = aiRouteTimer('text/generate')
  try {
    await requireCanonicalAiGatewayAccess(request)
    const raw = await request.text()
    if (!raw?.trim()) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
    }
    let body: unknown
    try {
      body = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const input = bodySchema.parse(body)
    // Avoid hanging requests when local Ollama isn't running.
    const ms = Number(process.env.AI_TEXT_TIMEOUT_MS ?? 45_000)
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), ms)
    const text = await generateText({
      prompt: input.prompt,
      system: input.system,
      maxTokens: input.maxTokens,
      temperature: input.temperature,
      signal: ac.signal as any,
    })
    clearTimeout(t)
    timer.success()
    return NextResponse.json({ text })
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    }
    timer.failure(err)
    console.error('/api/ai/text/generate error:', err)
    const message = err instanceof Error ? err.message : 'Text generation failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
