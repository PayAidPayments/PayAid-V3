import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'
import { createServerTiming, withCachedJson } from '@/lib/performance/api-server-timing'

export type BriefingItem = { text: string; href?: string }

/**
 * GET /api/home/briefing?tenantId=&fast=1
 * Soft-fails to 200 + rule-based bullets. AI is optional and hard-capped at 1.5s.
 */
function buildRuleBasedItems(
  tenantRouteKey: string,
  openDeals: number,
  valueLakhs: string,
  pendingInvoices: number,
  pendingLakhs: string,
  overdueInvoices: number,
  overdueTasks: number,
  activeEmployees: number
): BriefingItem[] {
  const items: BriefingItem[] = []
  if (openDeals > 0) {
    items.push({
      text: `You have ${openDeals} open deal${openDeals === 1 ? '' : 's'} in the pipeline (₹${valueLakhs} L). Focus on moving them to closure.`,
      href: `/crm/${tenantRouteKey}/Deals`,
    })
  }
  if (pendingInvoices > 0 || overdueInvoices > 0) {
    const parts: string[] = []
    if (pendingInvoices > 0) parts.push(`${pendingInvoices} pending (₹${pendingLakhs} L)`)
    if (overdueInvoices > 0) parts.push(`${overdueInvoices} overdue`)
    items.push({
      text: `Invoices: ${parts.join(', ')}. ${overdueInvoices > 0 ? 'Follow up on overdue invoices first.' : 'Send reminders or payment links as needed.'}`,
      href: `/finance/${tenantRouteKey}/Invoices`,
    })
  }
  if (overdueTasks > 0) {
    items.push({
      text: `${overdueTasks} task${overdueTasks === 1 ? ' is' : 's are'} not yet completed. Review and update or reschedule.`,
      href: `/crm/${tenantRouteKey}/Tasks`,
    })
  }
  if (activeEmployees > 0 && items.length < 4) {
    items.push({
      text: `${activeEmployees} active employee${activeEmployees === 1 ? '' : 's'} on the team.`,
      href: `/hr/${tenantRouteKey}/Employees`,
    })
  }
  if (items.length === 0) {
    items.push({
      text: 'No urgent items. Use today to plan ahead or clean up data.',
      href: `/crm/${tenantRouteKey}/Home`,
    })
  }
  return items.slice(0, 4)
}

function parseAIBullets(text: string): string[] {
  return text
    .split(/\n/)
    .map((l) => l.replace(/^[\s\-*•·]+|\d+\.\s*/g, '').trim())
    .filter((l) => l.length > 10)
    .slice(0, 4)
}

function attachHrefs(bullets: string[], tenantRouteKey: string, fallback: BriefingItem[]): BriefingItem[] {
  return bullets.map((text, i) => {
    const lower = text.toLowerCase()
    let href: string | undefined
    if (/(invoice|receivable|payment|overdue)/.test(lower)) href = `/finance/${tenantRouteKey}/Invoices`
    else if (/(task|todo|to-do|follow[- ]?up)/.test(lower)) href = `/crm/${tenantRouteKey}/Tasks`
    else if (/(deal|pipeline|lead|crm)/.test(lower)) href = `/crm/${tenantRouteKey}/Deals`
    else if (/(employee|team|hr|workforce)/.test(lower)) href = `/hr/${tenantRouteKey}/Employees`
    else if (fallback[i]?.href) href = fallback[i].href
    return { text, href }
  })
}

async function safeCount(label: string, fn: () => Promise<number>): Promise<number> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[HOME_BRIEFING] ${label} failed:`, err)
    return 0
  }
}

async function safeSum(
  label: string,
  fn: () => Promise<{ _sum: { value?: number | null; total?: number | null } }>
): Promise<number> {
  try {
    const r = await fn()
    return r._sum.value ?? r._sum.total ?? 0
  } catch (err) {
    console.error(`[HOME_BRIEFING] ${label} failed:`, err)
    return 0
  }
}

function fallbackBody(message?: string) {
  return {
    error: message || 'Failed to load briefing',
    degraded: true,
    tenantId: '',
    bullets: ['No urgent items. Use today to plan ahead or clean up data.'],
    items: [{ text: 'No urgent items. Use today to plan ahead or clean up data.' }],
    source: 'rule-based' as const,
  }
}

export async function GET(request: NextRequest) {
  const timing = createServerTiming()

  try {
    timing.start('auth')
    const payload = await authenticateRequest(request)
    timing.end('auth')

    const authTenantId = payload?.tenantId ?? (payload as { tenant_id?: string })?.tenant_id
    if (!authTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = request.nextUrl
    const queryTenantId = url.searchParams.get('tenantId')?.trim()
    const fast = url.searchParams.get('fast') === '1' || process.env.HOME_BRIEFING_SKIP_AI === '1'

    let tenantId = queryTenantId && authTenantId === queryTenantId ? queryTenantId : authTenantId
    let tenantRouteKey = tenantId

    if (queryTenantId && queryTenantId !== authTenantId && queryTenantId.length < 30) {
      try {
        const bySlug = await prisma.tenant.findFirst({
          where: { OR: [{ slug: queryTenantId }, { subdomain: queryTenantId }] },
          select: { id: true, slug: true, subdomain: true },
        })
        if (bySlug && bySlug.id === authTenantId) {
          tenantId = bySlug.id
          tenantRouteKey = bySlug.slug || bySlug.subdomain || queryTenantId
        }
      } catch (err) {
        console.error('[HOME_BRIEFING] tenant resolve failed:', err)
      }
    } else {
      try {
        const t = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { slug: true, subdomain: true },
        })
        tenantRouteKey = t?.slug || t?.subdomain || tenantId
      } catch {
        /* keep tenantId as route key */
      }
    }

    const cacheKey = `home:briefing:${tenantId}:${fast ? 'fast' : 'ai'}`

    const result = await withCachedJson(cacheKey, 60, async () => {
      timing.start('db')
      const [
        openDeals,
        openDealsValueNum,
        pendingInvoices,
        pendingTotal,
        overdueInvoices,
        overdueTasks,
        activeEmployees,
      ] = await Promise.all([
        safeCount('openDeals', () =>
          prisma.deal.count({ where: { tenantId, stage: { notIn: ['won', 'lost'] } } })
        ),
        safeSum('openDealsValue', () =>
          prisma.deal.aggregate({
            where: { tenantId, stage: { notIn: ['won', 'lost'] } },
            _sum: { value: true },
          })
        ),
        safeCount('pendingInvoices', () =>
          prisma.invoice.count({ where: { tenantId, status: { in: ['sent', 'issued'] } } })
        ),
        safeSum('pendingInvoicesTotal', () =>
          prisma.invoice.aggregate({
            where: { tenantId, status: { in: ['sent', 'issued'] } },
            _sum: { total: true },
          })
        ),
        safeCount('overdueInvoices', () =>
          prisma.invoice.count({
            where: {
              tenantId,
              status: { in: ['sent', 'issued'] },
              dueDate: { lt: new Date() },
            },
          })
        ),
        safeCount('overdueTasks', () =>
          prisma.task.count({ where: { tenantId, status: { not: 'completed' } } })
        ),
        safeCount('activeEmployees', () =>
          prisma.employee.count({ where: { tenantId, status: 'ACTIVE' } })
        ),
      ])
      timing.end('db')

      const valueLakhs = (openDealsValueNum / 1_00_000).toFixed(1)
      const pendingLakhs = (pendingTotal / 1_00_000).toFixed(1)
      const ruleBased = buildRuleBasedItems(
        tenantRouteKey,
        openDeals,
        valueLakhs,
        pendingInvoices,
        pendingLakhs,
        overdueInvoices,
        overdueTasks,
        activeEmployees
      )

      if (fast) {
        return {
          tenantId,
          bullets: ruleBased.map((i) => i.text),
          items: ruleBased,
          source: 'rule-based' as const,
        }
      }

      const kpiSummary = {
        openDeals,
        openDealsValueLakhs: valueLakhs,
        pendingInvoices,
        pendingInvoicesLakhs: pendingLakhs,
        overdueInvoices,
        overdueTasks,
        activeEmployees,
      }
      const userPrompt = `Today's KPI summary for this company:\n${JSON.stringify(kpiSummary, null, 2)}\n\nWrite exactly 2-3 short daily briefing bullet points (one per line, no numbering). Be concise and actionable. Focus on deals, invoices, and tasks.`

      let items = ruleBased
      let source: 'groq' | 'ollama' | 'rule-based' = 'rule-based'
      const AI_TIMEOUT_MS = 1500

      timing.start('external')
      try {
        const aiPromise = (async () => {
          if (process.env.GROQ_API_KEY?.trim()) {
            try {
              const groq = getGroqClient()
              const res = await groq.chat([
                {
                  role: 'system',
                  content:
                    'You are a business daily briefing assistant. Output only 2-3 bullet points, one per line. No intro or outro.',
                },
                { role: 'user', content: userPrompt },
              ])
              const parsed = parseAIBullets(res.message || '')
              if (parsed.length >= 1) {
                return {
                  items: attachHrefs(parsed, tenantRouteKey, ruleBased),
                  source: 'groq' as const,
                }
              }
            } catch (err) {
              console.warn(
                '[HOME_BRIEFING] Groq failed, trying Ollama:',
                err instanceof Error ? err.message : err
              )
            }
          }

          if (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_API_KEY) {
            try {
              const ollama = getOllamaClient()
              const res = await ollama.chat([
                {
                  role: 'system',
                  content:
                    'You are a business daily briefing assistant. Output only 2-3 bullet points, one per line. No intro or outro.',
                },
                { role: 'user', content: userPrompt },
              ])
              const parsed = parseAIBullets(res.message || '')
              if (parsed.length >= 1) {
                return {
                  items: attachHrefs(parsed, tenantRouteKey, ruleBased),
                  source: 'ollama' as const,
                }
              }
            } catch (err) {
              console.warn(
                '[HOME_BRIEFING] Ollama failed, using rule-based:',
                err instanceof Error ? err.message : err
              )
            }
          }

          return { items: ruleBased, source: 'rule-based' as const }
        })()

        const timeoutPromise = new Promise<{
          items: BriefingItem[]
          source: 'groq' | 'ollama' | 'rule-based'
        }>((resolve) => {
          setTimeout(() => {
            console.warn(`[HOME_BRIEFING] AI timed out after ${AI_TIMEOUT_MS}ms, returning rule-based`)
            resolve({ items: ruleBased, source: 'rule-based' })
          }, AI_TIMEOUT_MS)
        })

        const aiResult = await Promise.race([aiPromise, timeoutPromise])
        items = aiResult.items
        source = aiResult.source
      } catch (aiError) {
        console.warn('[HOME_BRIEFING] AI race failed, using rule-based:', aiError)
        items = ruleBased
        source = 'rule-based'
      }
      timing.end('external')

      return {
        tenantId,
        bullets: items.map((i) => i.text),
        items,
        source,
      }
    }, timing)

    return NextResponse.json(result, {
      headers: { 'Server-Timing': timing.toHeaders() },
    })
  } catch (e) {
    console.error('[HOME_BRIEFING] Unexpected error, returning safe fallback:', e, timing.toLogMeta())
    return NextResponse.json(fallbackBody(e instanceof Error ? e.message : undefined), {
      status: 200,
      headers: { 'Server-Timing': timing.toHeaders() },
    })
  }
}
