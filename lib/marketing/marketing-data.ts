// @ts-nocheck — references Prisma models not yet in schema (marketing channel stack).
import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

export type ChannelAccountsResult = {
  rows: Awaited<ReturnType<typeof prisma.channelAccount.findMany>>
  channelAccountsTableReady: boolean
}

/**
 * Loads connected channel accounts. If migrations are not applied yet (P2021), returns [] and
 * `channelAccountsTableReady: false` so the UI can prompt to run `db:migrate` / `migrate deploy`.
 */
export async function getChannelAccounts(tenantId: string): Promise<ChannelAccountsResult> {
  try {
    const rows = await prisma.channelAccount.findMany({
      where: { tenantId },
      orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }],
    })
    return { rows, channelAccountsTableReady: true }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021') {
      console.warn(
        '[marketing-data] ChannelAccount table missing — run `npm run db:migrate:deploy` from repo root; use DATABASE_DIRECT_URL (directUrl in schema) if the pooler blocks migrate.'
      )
      return { rows: [], channelAccountsTableReady: false }
    }
    throw e
  }
}

export async function getContentItems(tenantId: string, limit = 20) {
  return prisma.contentItem.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })
}

export async function getMediaAssets(tenantId: string, limit = 20) {
  return prisma.mediaAsset.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getMarketingCampaigns(tenantId: string, limit = 20) {
  return prisma.campaign.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/** Existing SocialPost model (per-account); used for Marketing /social hub list. */
export async function getSocialPosts(tenantId: string, limit = 20) {
  return prisma.socialPost.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { account: { select: { id: true, platform: true, accountName: true } } },
  })
}
