import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { decrypt } from '@/lib/encryption'

const FETCH_TIMEOUT_MS = 12_000
const MAX_HTML_LENGTH = 80_000
const GEMINI_TEXT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12_000)
}

function extractMeta(html: string): { title: string; description: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i)
  return {
    title: (titleMatch?.[1] || '').trim().slice(0, 500),
    description: (descMatch?.[1] || ogDesc?.[1] || '').trim().slice(0, 1000),
  }
}

export async function POST(request: NextRequest) {
  let tenantId: string
  try {
    const result = await requireModuleAccess(request, 'marketing')
    tenantId = result.tenantId
  } catch (licenseError) {
    return handleLicenseError(licenseError)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const pastedContent = typeof body.pastedContent === 'string' ? body.pastedContent.trim() : ''
    const usePaste = pastedContent.length >= 50

    if (!usePaste && (!url || !isValidUrl(url))) {
      return NextResponse.json(
        { error: 'Invalid input', message: 'Provide a valid http/https URL or paste content (at least 50 characters).' },
        { status: 400 }
      )
    }

    const tenant = await prismaWithRetry(() =>
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { googleAiStudioApiKey: true },
      })
    )
    let apiKey: string | null = tenant?.googleAiStudioApiKey ?? null
    if (apiKey) {
      const raw = apiKey
      const isEncrypted = raw.includes(':') && raw.split(':').length === 2
      if (isEncrypted) {
        try {
          apiKey = decrypt(raw)
        } catch {
          return NextResponse.json(
            { error: 'API key decryption failed', message: 'Please re-add your API key in Settings > AI Integrations.' },
            { status: 500 }
          )
        }
      }
    }
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key', message: 'Configure Google AI Studio API key in Settings > AI Integrations to use Analyze.' },
        { status: 400 }
      )
    }

    let combined: string
    const sourceLabel = usePaste ? (url || 'Pasted content') : url

    if (usePaste) {
      combined = pastedContent.slice(0, 28_000)
    } else {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
      let html: string
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PayAid-AdInsights/1.0)',
            Accept: 'text/html,application/xhtml+xml',
          },
          redirect: 'follow',
        })
        clearTimeout(timeoutId)
        if (!res.ok) {
          return NextResponse.json(
            { error: 'Fetch failed', message: `Page returned ${res.status}. The site may block automated access. Try pasting the page content instead.` },
            { status: 422 }
          )
        }
        const raw = await res.text()
        html = raw.slice(0, MAX_HTML_LENGTH)
      } catch (e) {
        clearTimeout(timeoutId)
        if ((e as Error).name === 'AbortError') {
          return NextResponse.json(
            { error: 'Timeout', message: 'The page took too long to load. Try pasting the page content instead.' },
            { status: 408 }
          )
        }
        return NextResponse.json(
          { error: 'Fetch failed', message: 'Could not load the URL. Try pasting the page content instead.' },
          { status: 422 }
        )
      }

      const { title, description } = extractMeta(html)
      const bodyText = stripHtml(html)
      combined = [
        title && `Title: ${title}`,
        description && `Meta description: ${description}`,
        bodyText && `Page text (excerpt): ${bodyText}`,
      ]
        .filter(Boolean)
        .join('\n\n')

      if (!combined || combined.length < 50) {
        return NextResponse.json(
          { error: 'Insufficient content', message: 'Could not extract enough text from the page. Try pasting content manually below.' },
          { status: 422 }
        )
      }
    }

    const prompt = `You are an ad strategist. Below is content from a competitor or ad page (Source: ${sourceLabel}).

Provide a short analysis in this exact format:
1) SUMMARY: 2-3 sentences on what this page/brand is about and who it targets.
2) SUGGESTED ANGLES: List 2-4 concrete creative angles for our own ads (hooks, formats, or messaging ideas). One short line per angle.

Keep the response concise and actionable. Use plain text; no markdown.`

    const geminiRes = await fetch(GEMINI_TEXT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `Page content:\n\n${combined.slice(0, 28000)}\n\n---\n\n${prompt}` },
            ],
          },
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
      }),
    })

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}))
      console.error('Ad Insights Gemini error:', geminiRes.status, err)
      return NextResponse.json(
        { error: 'Analysis failed', message: 'AI analysis failed. Check your API key and try again.' },
        { status: 502 }
      )
    }

    const data = await geminiRes.json()
    const text = data.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text?.trim() || ''
    if (!text) {
      return NextResponse.json(
        { error: 'No analysis', message: 'AI did not return a response. Try again.' },
        { status: 502 }
      )
    }

    const summaryMatch = text.match(/SUMMARY:?\s*([\s\S]*?)(?=SUGGESTED ANGLES:|$)/i)
    const anglesMatch = text.match(/SUGGESTED ANGLES:?\s*([\s\S]*)/i)
    const summary = (summaryMatch?.[1] || text).trim().slice(0, 800)
    const anglesBlock = (anglesMatch?.[1] || '').trim()
    const suggestedAngles = anglesBlock
      .split(/\n+/)
      .map((s) => s.replace(/^[\s\-*•]\s*/, '').trim())
      .filter((s) => s.length > 0)
      .slice(0, 6)

    return NextResponse.json({ summary, suggestedAngles, url: sourceLabel })
  } catch (e) {
    console.error('Ad Insights analyze error:', e)
    return NextResponse.json(
      { error: 'Server error', message: e instanceof Error ? e.message : 'Analysis failed.' },
      { status: 500 }
    )
  }
}
