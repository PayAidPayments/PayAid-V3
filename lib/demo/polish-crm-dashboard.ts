/**
 * Idempotent CRM dashboard polish for Demo Business (subdomain demo or name match).
 * Seeds lead-source aggregates, a small amount of churn-risk signal, and at least one won deal
 * in the current month so revenue / quarterly metrics / AI target progress are non-zero in demos.
 */
import { prisma } from '@/lib/db/prisma'
import { endOfMonth, startOfMonth } from 'date-fns'

function isDemoTenant(tenant: { name: string | null; subdomain: string | null } | null): boolean {
  if (!tenant) return false
  if (tenant.subdomain === 'demo') return true
  if (tenant.name && /demo business/i.test(tenant.name)) return true
  return false
}

export async function polishCrmDashboardForDemoTenant(tenantId: string): Promise<{ applied: boolean; modified: boolean }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true, subdomain: true },
  })
  if (!isDemoTenant(tenant)) {
    return { applied: false, modified: false }
  }

  let modified = false
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const sourceRows: Array<{
    name: string
    type: string
    leadsCount: number
    conversionsCount: number
    totalValue: number
    conversionRate: number
  }> = [
    {
      name: 'Content Marketing',
      type: 'organic',
      leadsCount: 42,
      conversionsCount: 8,
      totalValue: 2_800_000,
      conversionRate: 19,
    },
    {
      name: 'YouTube',
      type: 'social',
      leadsCount: 28,
      conversionsCount: 5,
      totalValue: 1_200_000,
      conversionRate: 17.9,
    },
    {
      name: 'Instagram',
      type: 'social',
      leadsCount: 22,
      conversionsCount: 4,
      totalValue: 890_000,
      conversionRate: 18.2,
    },
  ]

  for (const s of sourceRows) {
    const existing = await prisma.leadSource.findFirst({
      where: { tenantId, name: s.name },
    })
    if (existing) {
      const needsUpdate =
        existing.leadsCount < s.leadsCount ||
        existing.conversionsCount < s.conversionsCount ||
        existing.totalValue < s.totalValue
      if (needsUpdate) {
        await prisma.leadSource.update({
          where: { id: existing.id },
          data: {
            leadsCount: Math.max(existing.leadsCount, s.leadsCount),
            conversionsCount: Math.max(existing.conversionsCount, s.conversionsCount),
            totalValue: Math.max(existing.totalValue, s.totalValue),
            conversionRate: Math.max(existing.conversionRate, s.conversionRate),
            type: s.type,
          },
        })
        modified = true
      }
    } else {
      await prisma.leadSource.create({
        data: {
          tenantId,
          name: s.name,
          type: s.type,
          leadsCount: s.leadsCount,
          conversionsCount: s.conversionsCount,
          totalValue: s.totalValue,
          conversionRate: s.conversionRate,
        },
      })
      modified = true
    }
  }

  const riskCandidates = await prisma.contact.findMany({
    where: { tenantId },
    take: 3,
    // Contact model has no updatedAt; use createdAt for recency.
    orderBy: { createdAt: 'desc' },
    select: { id: true, churnRisk: true },
  })
  const needRisk = riskCandidates.filter((c) => c.churnRisk !== true)
  if (needRisk.length > 0) {
    await prisma.contact.updateMany({
      where: { id: { in: needRisk.map((c) => c.id) } },
      data: { churnRisk: true },
    })
    modified = true
  }

  const wonThisMonth = await prisma.deal.findFirst({
    where: {
      tenantId,
      stage: 'won',
      actualCloseDate: { gte: monthStart, lte: monthEnd },
    },
    select: { id: true },
  })
  if (!wonThisMonth) {
    let contact = await prisma.contact.findFirst({
      where: { tenantId },
      select: { id: true },
    })
    if (!contact) {
      const c = await prisma.contact.create({
        data: {
          tenantId,
          name: 'Demo CRM Contact',
          email: `demo-crm-polish-${tenantId.slice(0, 8)}@example.com`,
          stage: 'contact',
          status: 'active',
          source: 'Content Marketing',
        },
      })
      contact = { id: c.id }
      modified = true
    }
    const closeDay = Math.min(Math.max(now.getDate(), 1), 28)
    await prisma.deal.create({
      data: {
        tenantId,
        contactId: contact.id,
        name: 'Demo — Annual subscription (won)',
        value: 425_000,
        probability: 100,
        stage: 'won',
        actualCloseDate: new Date(now.getFullYear(), now.getMonth(), closeDay, 12, 0, 0),
      },
    })
    modified = true
  }

  return { applied: true, modified }
}
