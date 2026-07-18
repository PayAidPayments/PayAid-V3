import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

function envFlag(name: string) {
  const v = String(process.env[name] || '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')

    // Safety: never allow silent demo seeding in production.
    const allow =
      envFlag('PAYAID_ALLOW_DEMO_SEED') ||
      (process.env.NODE_ENV !== 'production' && request.headers.get('x-demo-seed') === '1')

    if (!allow) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Demo seed disabled',
          fix: [
            'Set PAYAID_ALLOW_DEMO_SEED=1 (recommended for demo environments), or',
            'In non-production, send header x-demo-seed: 1',
          ],
        },
        { status: 403 },
      )
    }

    const now = new Date()
    const existingCampaigns = await prisma.campaign.count({ where: { tenantId } })
    const existingSocial = await prisma.socialPost.count({ where: { tenantId } })
    const existingScheduled = await prisma.scheduledPost.count({ where: { tenantId } })

    if (existingCampaigns > 0 || existingSocial > 0 || existingScheduled > 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'Marketing data already exists',
        counts: { campaigns: existingCampaigns, socialPosts: existingSocial, scheduledPosts: existingScheduled },
      })
    }

    // Ensure a connected social account exists.
    const account =
      (await prisma.socialMediaAccount.findFirst({ where: { tenantId, isConnected: true } })) ??
      (await prisma.socialMediaAccount.create({
        data: {
          tenantId,
          platform: 'linkedin',
          accountName: 'PayAid Demo (LinkedIn)',
          accountId: `demo_${tenantId.slice(0, 8)}`,
          accessToken: 'demo_token',
          isConnected: true,
          followerCount: 12800,
          lastSyncAt: now,
        },
      }))

    // Seed 3 campaigns with plausible metrics (not inflated; internally consistent).
    const campaignSeeds = [
      { name: 'Q3 Webinar Invite: CFO Playbook', type: 'email' as const, subject: 'Join our CFO playbook webinar', content: 'Webinar invite content…' },
      { name: 'WhatsApp: GST filing reminder', type: 'whatsapp' as const, subject: null, content: 'Reminder + CTA…' },
      { name: 'SMS: Festival offer follow-up', type: 'sms' as const, subject: null, content: 'Offer reminder…' },
    ]

    const createdCampaigns = []
    for (let i = 0; i < campaignSeeds.length; i++) {
      const base = 420 + i * 180
      const sent = base
      const delivered = clamp(Math.round(sent * (0.94 - i * 0.02)), 0, sent)
      const opened = campaignSeeds[i].type === 'sms' ? 0 : clamp(Math.round(delivered * (0.22 + i * 0.03)), 0, delivered)
      const clicked = clamp(Math.round(delivered * (0.03 + i * 0.01)), 0, delivered)

      createdCampaigns.push(
        await prisma.campaign.create({
          data: {
            tenantId,
            name: campaignSeeds[i].name,
            type: campaignSeeds[i].type,
            subject: campaignSeeds[i].subject ?? undefined,
            content: campaignSeeds[i].content,
            status: 'sent',
            recipientCount: sent,
            sent,
            delivered,
            opened,
            clicked,
            bounced: clamp(Math.round(sent * 0.01), 0, sent),
            unsubscribed: clamp(Math.round(delivered * 0.002), 0, delivered),
            spendInr: 12500 + i * 4800,
            budgetInr: 18000 + i * 5000,
            playbookSlug: i === 0 ? 'new-lead-3-step' : undefined,
            sentAt: new Date(now.getTime() - (i + 1) * 86400000),
          },
          select: { id: true, name: true, type: true, sent: true, delivered: true, opened: true, clicked: true },
        }),
      )
    }

    // Seed social posts (published) for last 14 days.
    const socialSeeds = [
      { platform: 'linkedin', content: 'How SMBs can close books 3× faster with PayAid.', impressions: 9200, engagement: 640, clicks: 120 },
      { platform: 'instagram', content: 'New feature: campaign analytics that map to pipeline.', impressions: 5100, engagement: 410, clicks: 58 },
      { platform: 'twitter', content: 'We shipped Marketing Command Center in PayAid V3.', impressions: 3800, engagement: 260, clicks: 44 },
      { platform: 'linkedin', content: 'Case study: GST compliance automation in 7 days.', impressions: 7400, engagement: 520, clicks: 96 },
    ]

    const social = await Promise.all(
      socialSeeds.map((s, idx) => {
        const publishedAt = new Date(now.getTime() - (idx + 2) * 3 * 86400000)
        // Stagger hours for best-time-to-post demo (Tue 10am, Thu 7pm, Sat 11am, Wed 6pm IST-ish)
        const demoHours = [10, 19, 11, 18]
        publishedAt.setHours(demoHours[idx] ?? 12, 0, 0, 0)
        return prisma.socialPost.create({
          data: {
            tenantId,
            accountId: account.id,
            platform: s.platform,
            content: s.content,
            status: 'PUBLISHED',
            publishedAt,
            scheduledAt: null,
            reach: Math.round(s.impressions * 0.55),
            impressions: s.impressions,
            engagement: s.engagement,
            likes: Math.round(s.engagement * 0.6),
            comments: Math.round(s.engagement * 0.12),
            shares: Math.round(s.engagement * 0.06),
            clicks: s.clicks,
            platformPostId: `demo_post_${idx + 1}`,
          },
          select: { id: true, platform: true, impressions: true, engagement: true, clicks: true },
        })
      }),
    )

    // Seed 2 scheduled posts + 1 failed scheduled post.
    const scheduled = await Promise.all([
      prisma.scheduledPost.create({
        data: {
          tenantId,
          accountId: account.id,
          platform: 'linkedin',
          content: 'Upcoming: ROI benchmark report for SMB finance leaders.',
          scheduledAt: new Date(now.getTime() + 2 * 86400000),
          status: 'SCHEDULED',
        },
        select: { id: true, platform: true, status: true, scheduledAt: true },
      }),
      prisma.scheduledPost.create({
        data: {
          tenantId,
          accountId: account.id,
          platform: 'instagram',
          content: 'Upcoming: best time-to-post experiment results.',
          scheduledAt: new Date(now.getTime() + 4 * 86400000),
          status: 'SCHEDULED',
        },
        select: { id: true, platform: true, status: true, scheduledAt: true },
      }),
      prisma.scheduledPost.create({
        data: {
          tenantId,
          accountId: account.id,
          platform: 'linkedin',
          content: 'This post will fail (demo).',
          scheduledAt: new Date(now.getTime() - 2 * 86400000),
          status: 'FAILED',
          errorMessage: 'Demo: provider rejected payload',
        },
        select: { id: true, platform: true, status: true, scheduledAt: true },
      }),
    ])

    await prisma.marketingSettings.upsert({
      where: { tenantId },
      create: { tenantId, monthlyBudgetInr: 75000, waMonthlyBudgetInr: 25000, emailMonthlyBudgetInr: 35000 },
      update: { monthlyBudgetInr: 75000, waMonthlyBudgetInr: 25000, emailMonthlyBudgetInr: 35000 },
    }).catch(() => null)

    const marketingPosts = await Promise.all([
      prisma.marketingPost.create({
        data: {
          tenantId,
          channel: 'LINKEDIN',
          content: 'Studio draft: product launch teaser',
          status: 'DRAFT',
        },
        select: { id: true, channel: true, status: true },
      }).catch(() => null),
      prisma.marketingPost.create({
        data: {
          tenantId,
          channel: 'WHATSAPP',
          content: 'Scheduled WA broadcast for GST reminder cohort',
          status: 'SCHEDULED',
          scheduledFor: new Date(now.getTime() + 3 * 86400000),
        },
        select: { id: true, channel: true, status: true },
      }).catch(() => null),
    ])

    const socialEvents = await Promise.all([
      prisma.socialActivityEvent.create({
        data: {
          tenantId,
          platform: 'linkedin',
          source: 'demo-seed',
          action: 'comment',
          actorName: 'Priya Sharma',
          actorHandle: 'priya-finance',
          objectText: 'Does this integrate with Tally exports?',
          eventAt: new Date(now.getTime() - 2 * 3600000),
          metadata: { sentiment: 'neutral', url: 'https://linkedin.com/demo/1' },
        },
      }).catch(() => null),
      prisma.socialActivityEvent.create({
        data: {
          tenantId,
          platform: 'instagram',
          source: 'demo-seed',
          action: 'mention',
          actorName: 'Arjun Mehta',
          actorHandle: 'arjun.ops',
          objectText: 'Tagged PayAid in our month-end close workflow post.',
          eventAt: new Date(now.getTime() - 6 * 3600000),
          metadata: { sentiment: 'positive' },
        },
      }).catch(() => null),
      prisma.socialActivityEvent.create({
        data: {
          tenantId,
          platform: 'facebook',
          source: 'demo-seed',
          action: 'dm',
          actorName: 'Neha Kapoor',
          objectText: 'Can we get a demo for our marketing team?',
          eventAt: new Date(now.getTime() - 1 * 86400000),
          metadata: { sentiment: 'positive' },
        },
      }).catch(() => null),
    ])

    // Qualified leads for Command Center KPI (CRM-backed).
    const qualifiedContacts = await Promise.all([
      prisma.contact
        .create({
          data: {
            tenantId,
            name: 'Anita Desai (demo qualified)',
            email: `anita.qualified.${tenantId.slice(0, 6)}@payaid.demo`,
            type: 'lead',
            leadScore: 78,
            nurtureStage: 'hot',
            likelyToBuy: true,
          },
          select: { id: true, name: true, leadScore: true },
        })
        .catch(() => null),
      prisma.contact
        .create({
          data: {
            tenantId,
            name: 'Karthik Iyer (demo qualified)',
            email: `karthik.qualified.${tenantId.slice(0, 6)}@payaid.demo`,
            type: 'lead',
            leadScore: 62,
            nurtureStage: 'warm',
            likelyToBuy: true,
          },
          select: { id: true, name: true, leadScore: true },
        })
        .catch(() => null),
    ])

    // Unified inbox demo: inbound WhatsApp + email.
    let demoWhatsapp: { accountId: string; conversationId: string; messages: unknown[] } | null = null
    let demoEmail: { accountId: string; messages: unknown[] } | null = null

    const waAccount =
      (await prisma.whatsappAccount.findFirst({ where: { tenantId, isActive: true } }).catch(() => null)) ??
      (await prisma.whatsappAccount
        .create({
          data: {
            tenantId,
            businessName: 'PayAid Demo WA',
            primaryPhone: '+919876543210',
            status: 'connected',
            isWebConnected: true,
          },
          select: { id: true, primaryPhone: true },
        })
        .catch(() => null))

    if (waAccount) {
      const waContact = await prisma.contact
        .create({
          data: {
            tenantId,
            name: 'Ravi Menon (demo WA)',
            phone: '+919876543210',
            email: `ravi.wa.${tenantId.slice(0, 6)}@payaid.demo`,
            type: 'lead',
            leadScore: 55,
          },
          select: { id: true },
        })
        .catch(() => null)

      if (waContact) {
        const waConversation = await prisma.whatsappConversation
          .create({
            data: {
              accountId: waAccount.id,
              contactId: waContact.id,
              status: 'open',
              lastMessageAt: new Date(now.getTime() - 3 * 3600000),
              lastDirection: 'inbound',
              unreadCount: 2,
            },
            select: { id: true },
          })
          .catch(() => null)

        if (waConversation) {
          const waMessages = await Promise.all([
            prisma.whatsappMessage
              .create({
                data: {
                  conversationId: waConversation.id,
                  direction: 'inbound',
                  messageType: 'text',
                  fromNumber: '+919876543210',
                  toNumber: waAccount.primaryPhone,
                  text: 'Hi — can you share pricing for the GST automation module?',
                  createdAt: new Date(now.getTime() - 3 * 3600000),
                },
                select: { id: true, text: true },
              })
              .catch(() => null),
            prisma.whatsappMessage
              .create({
                data: {
                  conversationId: waConversation.id,
                  direction: 'inbound',
                  messageType: 'text',
                  fromNumber: '+919876543210',
                  toNumber: waAccount.primaryPhone,
                  text: 'We are a 40-person CA firm evaluating PayAid for client billing.',
                  createdAt: new Date(now.getTime() - 2 * 3600000),
                },
                select: { id: true, text: true },
              })
              .catch(() => null),
          ])
          demoWhatsapp = {
            accountId: waAccount.id,
            conversationId: waConversation.id,
            messages: waMessages.filter(Boolean),
          }
        }
      }
    }

    const tenantUser = await prisma.user
      .findFirst({ where: { tenantId }, select: { id: true, email: true } })
      .catch(() => null)

    if (tenantUser) {
      const demoEmailAddress = `marketing-inbox.${tenantId.slice(0, 8)}@payaid.demo`
      const emailAccount =
        (await prisma.emailAccount.findFirst({ where: { tenantId, email: demoEmailAddress } }).catch(() => null)) ??
        (await prisma.emailAccount
          .create({
            data: {
              tenantId,
              userId: tenantUser.id,
              email: demoEmailAddress,
              displayName: 'Marketing Demo Inbox',
              password: 'demo-not-used',
              provider: 'custom',
            },
            select: { id: true },
          })
          .catch(() => null))

      if (emailAccount) {
        const inboxFolder =
          (await prisma.emailFolder.findFirst({
            where: { accountId: emailAccount.id, type: 'inbox' },
          }).catch(() => null)) ??
          (await prisma.emailFolder
            .create({
              data: { accountId: emailAccount.id, name: 'INBOX', type: 'inbox' },
              select: { id: true },
            })
            .catch(() => null))

        if (inboxFolder) {
          const emailMessages = await Promise.all([
            prisma.emailMessage
              .create({
                data: {
                  accountId: emailAccount.id,
                  folderId: inboxFolder.id,
                  messageId: `demo-email-${tenantId.slice(0, 8)}-1`,
                  fromEmail: 'cfo@acme-india.demo',
                  fromName: 'Meera CFO',
                  toEmails: [demoEmailAddress],
                  ccEmails: [],
                  bccEmails: [],
                  subject: 'Re: Q3 webinar — team wants a trial',
                  body: 'Thanks for the invite. Can we get a 14-day trial for 5 users?',
                  receivedAt: new Date(now.getTime() - 5 * 3600000),
                  inReplyTo: 'demo-thread-1',
                },
                select: { id: true, subject: true },
              })
              .catch(() => null),
            prisma.emailMessage
              .create({
                data: {
                  accountId: emailAccount.id,
                  folderId: inboxFolder.id,
                  messageId: `demo-email-${tenantId.slice(0, 8)}-2`,
                  fromEmail: 'ops@retailco.demo',
                  fromName: 'Suresh Ops',
                  toEmails: [demoEmailAddress],
                  ccEmails: [],
                  bccEmails: [],
                  subject: 'WhatsApp campaign limits?',
                  body: 'What are the daily send limits for WhatsApp broadcasts on Growth plan?',
                  receivedAt: new Date(now.getTime() - 1 * 86400000),
                },
                select: { id: true, subject: true },
              })
              .catch(() => null),
          ])
          demoEmail = { accountId: emailAccount.id, messages: emailMessages.filter(Boolean) }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      seeded: true,
      tenantId,
      created: {
        socialAccountId: account.id,
        campaigns: createdCampaigns,
        socialPosts: social,
        scheduledPosts: scheduled,
        marketingPosts: marketingPosts.filter(Boolean),
        socialActivityEvents: socialEvents.filter(Boolean),
        qualifiedContacts: qualifiedContacts.filter(Boolean),
        unifiedInbox: {
          whatsapp: demoWhatsapp,
          email: demoEmail,
        },
      },
      next: {
        home: `/marketing/${tenantId}/Home`,
        channels: `/marketing/${tenantId}/Social-Media`,
        studio: `/marketing/${tenantId}/Studio`,
      },
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('Marketing demo seed error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to seed marketing demo data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

