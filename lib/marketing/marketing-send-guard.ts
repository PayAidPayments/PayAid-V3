// @ts-nocheck — references Prisma models not yet in schema (marketing channel stack).
import 'server-only'

import { prisma } from '@/lib/db/prisma'

/** Legacy fallback when channel-specific env is unset (paise-level precision not required). */
const STUB_INR_PER_SEND = 2

function intEnv(key: string, fallback: number): number {
  const v = process.env[key]?.trim()
  if (!v) return fallback
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

function startOfUtcMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0))
}

function channelKey(type: string): 'whatsapp' | 'email' | 'sms' | 'other' {
  const t = (type || '').toLowerCase()
  if (t === 'whatsapp') return 'whatsapp'
  if (t === 'email') return 'email'
  if (t === 'sms') return 'sms'
  return 'other'
}

/** Default cost (whole ₹) per outbound message when `ChannelEvent.costInr` is null. */
export function defaultCostInrForCampaignType(campaignType: string): number {
  const k = channelKey(campaignType)
  if (k === 'whatsapp') return intEnv('MARKETING_DEFAULT_COST_INR_WHATSAPP', 3)
  if (k === 'email') return intEnv('MARKETING_DEFAULT_COST_INR_EMAIL', 1)
  if (k === 'sms') return intEnv('MARKETING_DEFAULT_COST_INR_SMS', 4)
  return intEnv('MARKETING_DEFAULT_COST_INR_OTHER', STUB_INR_PER_SEND)
}

/**
 * Monthly spend by channel: sum COALESCE(costInr, per-channel default from env).
 */
export async function estimateMonthlySpendByChannel(tenantId: string) {
  const since = startOfUtcMonth()
  const wa = intEnv('MARKETING_DEFAULT_COST_INR_WHATSAPP', 3)
  const em = intEnv('MARKETING_DEFAULT_COST_INR_EMAIL', 1)
  const sm = intEnv('MARKETING_DEFAULT_COST_INR_SMS', 4)
  const stub = intEnv('MARKETING_DEFAULT_COST_INR_OTHER', STUB_INR_PER_SEND)

  const rows = await prisma.$queryRaw<Array<{ channelType: string; spend: bigint | null }>>`
    SELECT "channelType",
      COALESCE(SUM(COALESCE("costInr",
        CASE
          WHEN LOWER("channelType") LIKE '%whatsapp%' THEN ${wa}
          WHEN LOWER("channelType") = 'email' THEN ${em}
          WHEN LOWER("channelType") = 'sms' THEN ${sm}
          ELSE ${stub}
        END
      )), 0)::bigint AS spend
    FROM "ChannelEvent"
    WHERE "tenantId" = ${tenantId}
      AND "timestamp" >= ${since}
      AND "eventType" IN ('sent', 'delivered')
    GROUP BY "channelType"
  `

  let total = 0
  const byChannel: Record<string, number> = { whatsapp: 0, email: 0, sms: 0, other: 0 }
  for (const r of rows) {
    const n = Number(r.spend ?? 0)
    const c = channelKey(r.channelType)
    const key = c === 'other' ? 'other' : c
    byChannel[key] = (byChannel[key] ?? 0) + n
    total += n
  }
  return { totalInr: total, byChannel }
}

export type BudgetCheckCampaign = {
  type: string
  budgetInr?: number | null
  hardCap?: boolean | null
}

/**
 * Before enqueueing sends: quiet hours, tenant monthly / per-channel budget.
 * Campaign hardCap: when over tenant monthly budget, block this send.
 */
export async function assertMarketingSendAllowed(
  tenantId: string,
  campaign: BudgetCheckCampaign,
  options?: { contactCount?: number }
): Promise<{ allowed: true } | { allowed: false; code: string; message: string }> {
  const settings = await prisma.marketingSettings.findUnique({ where: { tenantId } })
  if (!settings) return { allowed: true }

  const hour = new Date().getHours()
  if (
    settings.quietHoursStart != null &&
    settings.quietHoursEnd != null &&
    settings.quietHoursStart !== settings.quietHoursEnd
  ) {
    const start = settings.quietHoursStart
    const end = settings.quietHoursEnd
    let inQuiet = false
    if (start < end) {
      inQuiet = hour >= start && hour < end
    } else {
      inQuiet = hour >= start || hour < end
    }
    if (inQuiet) {
      return {
        allowed: false,
        code: 'quiet_hours',
        message: 'Send window is in quiet hours. Schedule after quiet hours end.',
      }
    }
  }

  const { totalInr, byChannel } = await estimateMonthlySpendByChannel(tenantId)
  const ch = channelKey(campaign.type)
  const contacts = Math.max(0, options?.contactCount ?? 0)
  const perSend = defaultCostInrForCampaignType(campaign.type)
  const projected = contacts * perSend

  if (settings.monthlyBudgetInr != null && settings.monthlyBudgetInr > 0) {
    if (totalInr + projected > settings.monthlyBudgetInr) {
      if (campaign.hardCap) {
        return {
          allowed: false,
          code: 'tenant_monthly_budget',
          message: `Over monthly marketing budget (${settings.monthlyBudgetInr} ₹). Lower audience or raise budget in Settings.`,
        }
      }
    }
  }

  const chBudget =
    ch === 'whatsapp'
      ? settings.waMonthlyBudgetInr
      : ch === 'email'
        ? settings.emailMonthlyBudgetInr
        : ch === 'sms'
          ? settings.smsMonthlyBudgetInr
          : null

  if (chBudget != null && chBudget > 0) {
    const spent = byChannel[ch] ?? 0
    if (spent + projected > chBudget && campaign.hardCap) {
      return {
        allowed: false,
        code: 'channel_monthly_budget',
        message: `Over ${ch} monthly cap (${chBudget} ₹). Adjust in Marketing settings.`,
      }
    }
  }

  return { allowed: true }
}

/**
 * Drop contacts that already hit daily / weekly marketing send caps (all channels, `sent`/`delivered` events).
 */
export async function filterContactsByMarketingFrequencyCaps(
  tenantId: string,
  contactIds: string[]
): Promise<{ allowed: string[]; skippedCap: number }> {
  if (!contactIds.length) return { allowed: [], skippedCap: 0 }

  const settings = await prisma.marketingSettings.findUnique({ where: { tenantId } })
  const daily = settings?.dailyContactCap
  const weekly = settings?.weeklyContactCap
  if ((!daily || daily <= 0) && (!weekly || weekly <= 0)) {
    return { allowed: contactIds, skippedCap: 0 }
  }

  const now = new Date()
  const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [dayGroups, weekGroups] = await Promise.all([
    prisma.channelEvent.groupBy({
      by: ['contactId'],
      where: {
        tenantId,
        contactId: { in: contactIds },
        eventType: { in: ['sent', 'delivered'] },
        timestamp: { gte: dayStart },
      },
      _count: { id: true },
    }),
    prisma.channelEvent.groupBy({
      by: ['contactId'],
      where: {
        tenantId,
        contactId: { in: contactIds },
        eventType: { in: ['sent', 'delivered'] },
        timestamp: { gte: weekStart },
      },
      _count: { id: true },
    }),
  ])

  const dayMap = new Map(
    dayGroups.filter((g) => g.contactId != null).map((g) => [g.contactId as string, g._count.id])
  )
  const weekMap = new Map(
    weekGroups.filter((g) => g.contactId != null).map((g) => [g.contactId as string, g._count.id])
  )

  const allowed: string[] = []
  let skippedCap = 0
  for (const id of contactIds) {
    const d = dayMap.get(id) ?? 0
    const w = weekMap.get(id) ?? 0
    if (daily && daily > 0 && d >= daily) {
      skippedCap++
      continue
    }
    if (weekly && weekly > 0 && w >= weekly) {
      skippedCap++
      continue
    }
    allowed.push(id)
  }
  return { allowed, skippedCap }
}

export function budgetUsageSnapshot(
  settings: {
    monthlyBudgetInr: number | null
    waMonthlyBudgetInr: number | null
    emailMonthlyBudgetInr: number | null
    smsMonthlyBudgetInr: number | null
  } | null,
  spend: { totalInr: number; byChannel: Record<string, number> }
) {
  if (!settings) {
    return {
      hasSettings: false as const,
      overallPct: null as number | null,
      monthlyBudgetInr: null as number | null,
      currentSpendEstimateInr: spend.totalInr,
      channels: [] as { key: string; label: string; pct: number | null; budgetInr: number | null; spentInr: number }[],
    }
  }
  const overallPct =
    settings.monthlyBudgetInr && settings.monthlyBudgetInr > 0
      ? Math.min(100, Math.round((spend.totalInr / settings.monthlyBudgetInr) * 100))
      : null
  const channels = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      budgetInr: settings.waMonthlyBudgetInr,
      spentInr: spend.byChannel.whatsapp ?? 0,
    },
    {
      key: 'email',
      label: 'Email',
      budgetInr: settings.emailMonthlyBudgetInr,
      spentInr: spend.byChannel.email ?? 0,
    },
    {
      key: 'sms',
      label: 'SMS',
      budgetInr: settings.smsMonthlyBudgetInr,
      spentInr: spend.byChannel.sms ?? 0,
    },
  ].map((c) => ({
    ...c,
    pct:
      c.budgetInr != null && c.budgetInr > 0
        ? Math.min(100, Math.round((c.spentInr / c.budgetInr) * 100))
        : null,
  }))
  return {
    hasSettings: true as const,
    overallPct,
    monthlyBudgetInr: settings.monthlyBudgetInr,
    currentSpendEstimateInr: spend.totalInr,
    channels,
  }
}
