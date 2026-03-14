import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const bodySchema = z.object({
  prompt: z.string().min(1),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent']).optional(),
})

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

async function generateWithOllama(prompt: string, model = 'llama3.1'): Promise<string> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
    })
    const data = await res.json()
    return (data.response as string) || 'Content generation failed.'
  } catch (e) {
    console.error('Ollama content error:', e)
    return 'Content generation failed. Please try again.'
  }
}

/**
 * POST /api/social/ai/content
 * Self-hosted AI (Ollama) for Studio Step 2. Returns primary post text and optional channel variants.
 */
export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'marketing')
    const body = await request.json()
    const { prompt, tone } = bodySchema.parse(body)

    const systemTone = tone ? `Tone: ${tone}. ` : ''
    const mainPrompt = `${systemTone}Write a short social media post (1-3 sentences) for this: ${prompt}. Include a clear message and optional emoji. No hashtags in the main text.`
    const primary = await generateWithOllama(mainPrompt)

    const variantsPrompt = `Based on this post, give 4 very short variants (one per line, no labels):
"${primary}"
1) WhatsApp (friendly, under 160 chars)
2) Facebook (slightly longer, engaging)
3) LinkedIn (professional)
4) Twitter (concise, under 280 chars)
Output only the 4 lines, no numbers or titles.`
    const variantsText = await generateWithOllama(variantsPrompt)
    const lines = variantsText.split('\n').filter(Boolean).slice(0, 4)
    const variants: Record<string, string> = {}
    const keys = ['WHATSAPP', 'FACEBOOK', 'LINKEDIN', 'TWITTER']
    lines.forEach((line, i) => {
      variants[keys[i]] = line.trim()
    })
    if (Object.keys(variants).length === 0) variants.WHATSAPP = primary

    return NextResponse.json({ primary, variants })
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    console.error('Social AI content error:', err)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}
