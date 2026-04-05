import 'server-only'

import { prisma } from '@/lib/db/prisma'

const GLOBAL_PLAYBOOKS: Array<{
  slug: string
  name: string
  description: string
  icon: string
  channels: string[]
  goal: string
  config: Record<string, unknown>
}> = [
  {
    slug: 'new-lead-3-step',
    name: 'New Lead 3‑Step Nurture',
    description: 'WhatsApp intro → email follow-up → WhatsApp reminder.',
    icon: '🎯',
    channels: ['whatsapp', 'email'],
    goal: 'leads',
    config: {
      steps: [
        { offsetHours: 0, channel: 'whatsapp', template: 'intro' },
        { offsetHours: 24, channel: 'email', template: 'followup' },
        { offsetHours: 72, channel: 'whatsapp', template: 'reminder' },
      ],
    },
  },
  {
    slug: 'abandoned-cart',
    name: 'Abandoned Cart Recovery',
    description: 'Email nudge plus WhatsApp for cart abandoners.',
    icon: '🛒',
    channels: ['email', 'whatsapp'],
    goal: 'sales',
    config: {
      steps: [
        { offsetHours: 0, channel: 'email', template: 'cart_reminder' },
        { offsetHours: 24, channel: 'whatsapp', template: 'cart_wa' },
      ],
    },
  },
  {
    slug: 'festival-offer-blast',
    name: 'Festival Offer Blast',
    description: 'Multi-channel promo: WhatsApp, SMS, and email.',
    icon: '🎉',
    channels: ['whatsapp', 'sms', 'email'],
    goal: 'sales',
    config: {
      steps: [
        { offsetHours: 0, channel: 'whatsapp', template: 'festival_wa' },
        { offsetHours: 2, channel: 'sms', template: 'festival_sms' },
        { offsetHours: 4, channel: 'email', template: 'festival_email' },
      ],
    },
  },
]

/**
 * Idempotent: ensures global playbook rows exist (tenantId = null).
 */
export async function ensureGlobalMarketingPlaybooks(): Promise<void> {
  for (const p of GLOBAL_PLAYBOOKS) {
    await prisma.marketingPlaybook.upsert({
      where: { slug: p.slug },
      create: {
        tenantId: null,
        name: p.name,
        slug: p.slug,
        description: p.description,
        icon: p.icon,
        channels: p.channels,
        goal: p.goal,
        config: p.config as object,
        isActive: true,
      },
      update: {
        name: p.name,
        description: p.description,
        icon: p.icon,
        channels: p.channels,
        goal: p.goal,
        config: p.config as object,
        isActive: true,
      },
    })
  }
}

/** Cached dashboard reads should not write; use GET /api/marketing/playbooks to seed globals first. */
export async function listPlaybooksForTenant(tenantId: string, take = 8) {
  return prisma.marketingPlaybook.findMany({
    where: {
      isActive: true,
      OR: [{ tenantId: null }, { tenantId }],
    },
    orderBy: [{ tenantId: 'asc' }, { name: 'asc' }],
    take,
  })
}

export async function getPlaybookBySlug(slug: string, tenantId: string) {
  await ensureGlobalMarketingPlaybooks()
  return prisma.marketingPlaybook.findFirst({
    where: {
      slug,
      isActive: true,
      OR: [{ tenantId: null }, { tenantId }],
    },
  })
}
