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

  // Ensure enough contacts across stages so conversion/win/churn cards are meaningful.
  const existingContacts = await prisma.contact.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, stage: true, churnRisk: true },
  })

  if (existingContacts.length < 10) {
    const nowSuffix = Date.now().toString().slice(-6)
    const toCreate = 10 - existingContacts.length
    for (let i = 0; i < toCreate; i++) {
      await prisma.contact.create({
        data: {
          tenantId,
          name: `Demo Contact ${i + 1}`,
          email: `demo-contact-${nowSuffix}-${i + 1}@example.com`,
          company: i % 2 === 0 ? 'Demo Manufacturing Pvt Ltd' : 'Demo Retail LLP',
          stage: i < 4 ? 'customer' : 'prospect',
          status: 'active',
          source: i % 2 === 0 ? 'Content Marketing' : 'YouTube',
          churnRisk: i % 5 === 0,
        },
      })
    }
    modified = true
  }

  const contactPool = await prisma.contact.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, stage: true, churnRisk: true },
  })

  const customerCount = contactPool.filter((c) => c.stage === 'customer').length
  if (customerCount < 3) {
    const promoteIds = contactPool.slice(0, Math.min(3 - customerCount, contactPool.length)).map((c) => c.id)
    if (promoteIds.length > 0) {
      await prisma.contact.updateMany({
        where: { id: { in: promoteIds } },
        data: { stage: 'customer' },
      })
      modified = true
    }
  }

  const churnCount = contactPool.filter((c) => c.churnRisk).length
  if (churnCount < 2) {
    const churnIds = contactPool.slice(0, Math.min(2 - churnCount, contactPool.length)).map((c) => c.id)
    if (churnIds.length > 0) {
      await prisma.contact.updateMany({
        where: { id: { in: churnIds } },
        data: { churnRisk: true },
      })
      modified = true
    }
  }

  // Ensure active pipeline deals with value so avg deal size / forecasted value are non-zero.
  const activeDealsCount = await prisma.deal.count({
    where: {
      tenantId,
      stage: { in: ['lead', 'qualified', 'proposal', 'negotiation'] },
    },
  })
  if (activeDealsCount < 8) {
    const eligibleContacts = await prisma.contact.findMany({
      where: { tenantId },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })
    const stages: Array<'lead' | 'qualified' | 'proposal' | 'negotiation'> = ['lead', 'qualified', 'proposal', 'negotiation']
    const createCount = Math.min(8 - activeDealsCount, eligibleContacts.length)
    for (let i = 0; i < createCount; i++) {
      await prisma.deal.create({
        data: {
          tenantId,
          contactId: eligibleContacts[i].id,
          name: `Demo Pipeline Deal ${i + 1}`,
          value: 180_000 + i * 45_000,
          probability: 35 + i * 5,
          stage: stages[i % stages.length],
          expectedCloseDate: new Date(now.getFullYear(), now.getMonth(), Math.min(28, now.getDate() + 7 + i)),
        },
      })
    }
    modified = true
  }

  // Ensure overdue/open/completed tasks so overdue drill-through has matching data.
  const overdueTaskCount = await prisma.task.count({
    where: {
      tenantId,
      dueDate: { lt: now },
      status: { in: ['pending', 'in_progress'] },
    },
  })
  if (overdueTaskCount < 8) {
    const taskContacts = await prisma.contact.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true },
    })
    const createCount = Math.min(8 - overdueTaskCount, taskContacts.length || 8)
    for (let i = 0; i < createCount; i++) {
      await prisma.task.create({
        data: {
          tenantId,
          title: `Urgent follow-up ${i + 1}`,
          description: 'Auto-seeded overdue task for demo dashboard realism.',
          priority: i % 2 === 0 ? 'high' : 'medium',
          status: i % 3 === 0 ? 'in_progress' : 'pending',
          dueDate: new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000),
          contactId: taskContacts[i % Math.max(taskContacts.length, 1)]?.id || null,
        },
      })
    }
    modified = true
  }

  const completedTaskCount = await prisma.task.count({
    where: {
      tenantId,
      status: 'completed',
      completedAt: { gte: monthStart, lte: monthEnd },
    },
  })
  if (completedTaskCount < 5) {
    const taskContacts = await prisma.contact.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true },
    })
    for (let i = completedTaskCount; i < 5; i++) {
      const completedAt = new Date(now.getTime() - (i + 1) * 6 * 60 * 60 * 1000)
      await prisma.task.create({
        data: {
          tenantId,
          title: `Completed check-in ${i + 1}`,
          description: 'Auto-seeded completed task for demo metrics.',
          priority: 'medium',
          status: 'completed',
          dueDate: completedAt,
          completedAt,
          contactId: taskContacts[i % Math.max(taskContacts.length, 1)]?.id || null,
        },
      })
    }
    modified = true
  }

  // Ensure interaction history for Activities command center cards.
  const interactionCount = await prisma.interaction.count({
    where: {
      contact: { tenantId },
    },
  })
  if (interactionCount < 16) {
    const interactionContacts = await prisma.contact.findMany({
      where: { tenantId },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true },
    })
    if (interactionContacts.length > 0) {
    const kinds = ['call', 'email', 'meeting', 'whatsapp'] as const
    for (let i = interactionCount; i < 16; i++) {
      const kind = kinds[i % kinds.length]
      await prisma.interaction.create({
        data: {
          type: kind,
          subject: `${kind === 'call' ? 'Call' : kind === 'meeting' ? 'Meeting' : 'Message'} with customer ${i + 1}`,
          notes: 'Demo interaction seeded to support activity timeline and AI insights.',
          outcome: i % 3 === 0 ? 'follow-up required' : i % 3 === 1 ? 'meeting booked' : 'replied',
          duration: kind === 'call' || kind === 'meeting' ? 20 + i : null,
          contactId: interactionContacts[i % interactionContacts.length].id,
        },
      })
    }
    modified = true
    }
  }

  return { applied: true, modified }
}
