import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

const DEFAULT_WINDOW_DAYS = 365
const MAX_WINDOW_DAYS = 730
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

type LTVContact = {
  contact_id: string
  contact_name: string
  contact_email: string | null
  total_deals: number
  total_value: number
  avg_deal_value: number
  first_close: string | null
  last_close: string | null
  tenure_days: number | null
  /** Annualised LTV estimate: total_value / tenure_years (min 90 days tenure) */
  predicted_annual_ltv: number | null
}

/**
 * GET /api/v1/revenue/ltv
 *
 * Returns Lifetime Value per contact, derived from their closed-won deal history.
 * Contacts are ranked by total closed-won deal value descending.
 *
 * Query params:
 *   ?window_days=365  — look-back window for closed-won deals (max 730, default 365)
 *   ?limit=20         — max contacts to return (max 100, default 20)
 *   ?min_deals=1      — minimum closed-won deals to include contact (default 1)
 *
 * Feature gate: m1_revenue_intelligence
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_revenue_intelligence')

    const sp = request.nextUrl.searchParams
    const windowDays = Math.min(parseInt(sp.get('window_days') ?? String(DEFAULT_WINDOW_DAYS), 10) || DEFAULT_WINDOW_DAYS, MAX_WINDOW_DAYS)
    const limit = Math.min(parseInt(sp.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT)
    const minDeals = Math.max(parseInt(sp.get('min_deals') ?? '1', 10) || 1, 1)

    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

    // Fetch all closed-won deals in the window that have a contactId
    const deals = await prisma.deal.findMany({
      where: {
        tenantId,
        stage: 'closed_won',
        actualCloseDate: { gte: since },
        contactId: { not: null },
      },
      select: {
        contactId: true,
        value: true,
        actualCloseDate: true,
        contactName: true,
        contactEmail: true,
      },
      orderBy: { actualCloseDate: 'asc' },
    })

    // Aggregate per contact
    const contactMap = new Map<
      string,
      {
        contact_id: string
        contact_name: string
        contact_email: string | null
        values: number[]
        dates: Date[]
      }
    >()

    for (const deal of deals) {
      if (!deal.contactId) continue
      const key = deal.contactId
      const existing = contactMap.get(key)
      if (existing) {
        existing.values.push(deal.value)
        if (deal.actualCloseDate) existing.dates.push(deal.actualCloseDate)
      } else {
        contactMap.set(key, {
          contact_id: deal.contactId,
          contact_name: deal.contactName || deal.contactEmail || deal.contactId,
          contact_email: deal.contactEmail,
          values: [deal.value],
          dates: deal.actualCloseDate ? [deal.actualCloseDate] : [],
        })
      }
    }

    // Build ranked list
    const contacts: LTVContact[] = []
    for (const data of contactMap.values()) {
      if (data.values.length < minDeals) continue
      const total_value = data.values.reduce((s, v) => s + v, 0)
      const sortedDates = data.dates.sort((a, b) => a.getTime() - b.getTime())
      const first_close = sortedDates[0]?.toISOString() ?? null
      const last_close = sortedDates[sortedDates.length - 1]?.toISOString() ?? null
      const tenure_days =
        first_close && last_close
          ? Math.round(
              (new Date(last_close).getTime() - new Date(first_close).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null

      // Predict annual LTV only for contacts with ≥90 days tenure
      const predicted_annual_ltv =
        tenure_days !== null && tenure_days >= 90
          ? Math.round((total_value / tenure_days) * 365)
          : null

      contacts.push({
        contact_id: data.contact_id,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        total_deals: data.values.length,
        total_value,
        avg_deal_value: Math.round(total_value / data.values.length),
        first_close,
        last_close,
        tenure_days,
        predicted_annual_ltv,
      })
    }

    // Sort by total_value desc, then limit
    contacts.sort((a, b) => b.total_value - a.total_value)
    const paginated = contacts.slice(0, limit)

    return NextResponse.json({
      schema_version: '1.0',
      window_days: windowDays,
      limit,
      min_deals: minDeals,
      total_contacts: contacts.length,
      contacts: paginated,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    console.error('[revenue/ltv] unexpected error:', error)
    return NextResponse.json({ error: 'Failed to compute LTV' }, { status: 500 })
  }
}
