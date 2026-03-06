import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'

/**
 * GET /api/home/briefing?tenantId=
 * Returns 2-4 bullet points for the AI Daily Briefing block on Command Center.
 * Tries Groq then Ollama to generate natural-language bullets from KPIs; falls back to rule-based.
 */
function buildRuleBasedBullets(
  openDeals: number,
  valueLakhs: string,
  pendingInvoices: number,
  pendingLakhs: string,
  overdueInvoices: number,
  overdueTasks: number
): string[] {
  const bullets: string[] = []
  if (openDeals > 0) {
    bullets.push(`You have ${openDeals} open deal${openDeals === 1 ? '' : 's'} in the pipeline (₹${valueLakhs} L). Focus on moving them to closure.`)
  }
  if (pendingInvoices > 0 || overdueInvoices > 0) {
    const parts = []
    if (pendingInvoices > 0) parts.push(`${pendingInvoices} pending (₹${pendingLakhs} L)`)
    if (overdueInvoices > 0) parts.push(`${overdueInvoices} overdue`)
    bullets.push(`Invoices: ${parts.join(', ')}. ${overdueInvoices > 0 ? 'Follow up on overdue invoices first.' : 'Send reminders or payment links as needed.'}`)
  }
  if (overdueTasks > 0) {
    bullets.push(`${overdueTasks} task${overdueTasks === 1 ? ' is' : 's are'} not yet completed. Review and update or reschedule.`)
  }
  if (bullets.length === 0) {
    bullets.push('No urgent items. Use today to plan ahead or clean up data.')
  }
  return bullets.slice(0, 4)
}

/** Parse AI response into 2-4 bullet lines (strip markers, numbering, empty lines). */
function parseAIBullets(text: string): string[] {
  const lines = text
    .split(/\n/)
    .map((l) => l.replace(/^[\s\-*•·]+|\d+\.\s*/g, '').trim())
    .filter((l) => l.length > 10)
  return lines.slice(0, 4)
}

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticateRequest(request)
    const authTenantId = payload?.tenantId ?? (payload as { tenant_id?: string })?.tenant_id
    if (!authTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = request.nextUrl
    const queryTenantId = url.searchParams.get('tenantId')?.trim()
    let tenantId = queryTenantId && authTenantId === queryTenantId ? queryTenantId : authTenantId
    // Resolve slug to tenant id when query param is a slug (only allow if it's the auth tenant)
    if (queryTenantId && queryTenantId !== authTenantId && queryTenantId.length < 30) {
      const bySlug = await prisma.tenant.findFirst({
        where: { slug: queryTenantId },
        select: { id: true },
      })
      if (bySlug && bySlug.id === authTenantId) tenantId = bySlug.id
    }

    const [
      openDeals,
      openDealsValue,
      pendingInvoices,
      pendingInvoicesTotal,
      overdueInvoices,
      overdueTasks,
    ] = await Promise.all([
      prisma.deal.count({ where: { tenantId, stage: { notIn: ['won', 'lost'] } } }),
      prisma.deal.aggregate({
        where: { tenantId, stage: { notIn: ['won', 'lost'] } },
        _sum: { value: true },
      }),
      prisma.invoice.count({
        where: { tenantId, status: { in: ['sent', 'issued'] } },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, status: { in: ['sent', 'issued'] } },
        _sum: { total: true },
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ['sent', 'issued'] },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.task.count({ where: { tenantId, status: { not: 'completed' } } }),
    ])

    const valueLakhs = ((openDealsValue._sum.value ?? 0) / 1_00_000).toFixed(1)
    const pendingLakhs = ((pendingInvoicesTotal._sum.total ?? 0) / 1_00_000).toFixed(1)
    const ruleBased = buildRuleBasedBullets(
      openDeals,
      valueLakhs,
      pendingInvoices,
      pendingLakhs,
      overdueInvoices,
      overdueTasks
    )

    const kpiSummary = {
      openDeals,
      openDealsValueLakhs: valueLakhs,
      pendingInvoices,
      pendingInvoicesLakhs: pendingLakhs,
      overdueInvoices,
      overdueTasks,
    }
    const userPrompt = `Today's KPI summary for this company:\n${JSON.stringify(kpiSummary, null, 2)}\n\nWrite exactly 2-3 short daily briefing bullet points (one per line, no numbering). Be concise and actionable. Focus on deals, invoices, and tasks.`

    let bullets = ruleBased
    let source: 'groq' | 'ollama' | 'rule-based' = 'rule-based'

    if (process.env.GROQ_API_KEY?.trim()) {
      try {
        const groq = getGroqClient()
        const res = await groq.chat([
          { role: 'system', content: 'You are a business daily briefing assistant. Output only 2-3 bullet points, one per line. No intro or outro.' },
          { role: 'user', content: userPrompt },
        ])
        const parsed = parseAIBullets(res.message || '')
        if (parsed.length >= 1) {
          bullets = parsed
          source = 'groq'
        }
      } catch (err) {
        console.warn('[HOME_BRIEFING] Groq failed, trying Ollama:', err instanceof Error ? err.message : err)
      }
    }

    if (source === 'rule-based' && (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_API_KEY)) {
      try {
        const ollama = getOllamaClient()
        const res = await ollama.chat([
          { role: 'system', content: 'You are a business daily briefing assistant. Output only 2-3 bullet points, one per line. No intro or outro.' },
          { role: 'user', content: userPrompt },
        ])
        const parsed = parseAIBullets(res.message || '')
        if (parsed.length >= 1) {
          bullets = parsed
          source = 'ollama'
        }
      } catch (err) {
        console.warn('[HOME_BRIEFING] Ollama failed, using rule-based:', err instanceof Error ? err.message : err)
      }
    }

    return NextResponse.json({
      tenantId,
      bullets,
      source,
    })
  } catch (e) {
    console.error('[HOME_BRIEFING]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to load briefing' },
      { status: 500 }
    )
  }
}
