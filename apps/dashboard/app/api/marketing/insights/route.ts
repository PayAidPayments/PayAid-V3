import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getOllamaClient } from '@/lib/ai/ollama'
import { unstable_cache } from 'next/cache'

const INSIGHTS_CACHE_SECONDS = 60

/**
 * GET /api/marketing/insights
 * Returns 2–3 short AI-generated insights from recent campaign/post performance.
 * Uses self-hosted Ollama when available; falls back to static insights.
 */
async function computeInsights(tenantId: string): Promise<{ insights: string[]; source: 'ollama' | 'static' }> {
  const campaigns = await prisma.campaign.findMany({
    where: { tenantId, status: 'sent' },
    orderBy: { sentAt: 'desc' },
    take: 10,
  })

  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalDelivered = campaigns.reduce((s, c) => s + c.delivered, 0)
  const totalOpened = campaigns.reduce((s, c) => s + c.opened, 0)
  const totalClicked = campaigns.reduce((s, c) => s + c.clicked, 0)
  const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 1000) / 10 : 0
  const clickRate = totalDelivered > 0 ? Math.round((totalClicked / totalDelivered) * 1000) / 10 : 0

  const summary = `Campaigns sent: ${campaigns.length}. Total reach: ${totalSent}. Delivered: ${totalDelivered}. Opened: ${totalOpened} (${openRate}% open rate). Clicked: ${totalClicked} (${clickRate}% click rate).`

  try {
    const ollama = getOllamaClient()
    const systemPrompt = `You are a marketing analyst. Output exactly 3 short, actionable recommendations. Format: one line per recommendation. No numbering or bullets. First line = top priority (e.g. pipeline at risk, nurture now). Second = opportunity (e.g. channel RoI, shift budget). Third = channel-specific tip (e.g. WhatsApp open rate, try 2x frequency). Use ₹ for money. Keep each under 80 characters.`
    const prompt = `Based on these metrics: ${summary}. Give 3 recommendations: (1) top priority risk or action, (2) opportunity to shift budget or channel, (3) one channel tip (WhatsApp/Email/SMS).`
    const raw = await ollama.generateCompletion(prompt, systemPrompt)
    const lines = raw
      .split(/\n+/)
      .map((s) => s.replace(/^[\s\-*•]+/, '').trim())
      .filter((s) => s.length > 10)
    const insights = lines.slice(0, 3)
    if (insights.length >= 2) {
      return { insights, source: 'ollama' }
    }
  } catch (e) {
    console.warn('Marketing insights Ollama failed, using static fallback:', e)
  }

  // Static fallback (self-hosted flow preserved when Ollama unavailable)
  const staticInsights: string[] = []
  if (totalClicked > 0) {
    staticInsights.push(`${totalClicked} clicks from recent campaigns. Check Analytics for top performers.`)
  } else {
    staticInsights.push('Run campaigns and check Analytics for top performers.')
  }
  if (openRate > 0) {
    staticInsights.push(`Open rate ${openRate}%. Try A/B subject lines in Campaigns.`)
  } else {
    staticInsights.push('Improve open rates with clear subject lines and segments.')
  }
  staticInsights.push('Use Segments to target high-value contacts, then launch a Sequence or Campaign.')

  return { insights: staticInsights.slice(0, 3), source: 'static' }
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')

    const cached = await unstable_cache(
      () => computeInsights(tenantId),
      ['marketing-insights', tenantId],
      { revalidate: INSIGHTS_CACHE_SECONDS }
    )()

    const res = NextResponse.json(cached)
    res.headers.set('Cache-Control', `private, max-age=${INSIGHTS_CACHE_SECONDS}, stale-while-revalidate=120`)
    res.headers.set('Vary', 'Authorization')
    return res
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Marketing insights error:', error)
    return NextResponse.json(
      {
        insights: [
          'Run campaigns and check Analytics for top performers.',
          'Improve open rates with clear subject lines and segments.',
          'Use Segments to target high-value contacts, then launch a Sequence or Campaign.',
        ],
        source: 'static',
      },
      { status: 200 }
    )
  }
}
