// @ts-nocheck
/**
 * AI Image Studio: cache, rate limits, blocklist, brand guidelines.
 * Used by /api/ai/image/* routes.
 */

import { createHash } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'

const DEFAULT_DAILY_LIMIT_STARTER = 50
const DEFAULT_DAILY_LIMIT_PRO = 500

export interface ImageParams {
  prompt: string
  negativePrompt?: string
  style?: string
  size?: string
  width?: number
  height?: number
  steps?: number
  seed?: number
  model?: string
}

/** Stable hash for cache key (tenantId + params). */
export function imageParamsHash(params: ImageParams): string {
  const str = [
    (params.prompt || '').trim(),
    (params.negativePrompt || '').trim(),
    params.style ?? '',
    params.size ?? '',
    params.width ?? '',
    params.height ?? '',
    params.steps ?? '',
    params.seed ?? '',
    params.model ?? '',
  ].join('|')
  return createHash('sha256').update(str).digest('hex')
}

/** Get daily image generation limit for tenant (Starter 50, Pro 500, else 50). */
export async function getImageDailyLimit(tenantId: string): Promise<number> {
  const settings = await prismaWithRetry(() =>
    prisma.tenantAIImageSettings.findUnique({
      where: { tenantId },
      select: { dailyLimitOverride: true },
    })
  )
  if (settings?.dailyLimitOverride != null) return settings.dailyLimitOverride

  const tenant = await prismaWithRetry(() =>
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionTier: true, plan: true },
    })
  )
  const tier = (tenant?.subscriptionTier || tenant?.plan || 'free').toLowerCase()
  if (tier === 'professional' || tier === 'pro' || tier === 'enterprise') {
    return DEFAULT_DAILY_LIMIT_PRO
  }
  return DEFAULT_DAILY_LIMIT_STARTER
}

/** Count image generations for tenant today (UTC date). */
export async function getTodayImageCount(tenantId: string): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)
  const count = await prismaWithRetry(() =>
    prisma.aIImageGenerationLog.count({
      where: {
        tenantId,
        createdAt: { gte: startOfDay },
      },
    })
  )
  return count
}

/** Next UTC midnight for X-Limit-Reset header. */
export function getLimitResetAt(): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 1)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/** Check if prompt is blocked by tenant blocklist (phrase match, case-insensitive). */
export async function isPromptBlocked(tenantId: string, prompt: string): Promise<boolean> {
  const settings = await prismaWithRetry(() =>
    prisma.tenantAIImageSettings.findUnique({
      where: { tenantId },
      select: { promptBlocklist: true },
    })
  )
  const list = settings?.promptBlocklist ?? []
  if (list.length === 0) return false
  const lower = prompt.toLowerCase()
  return list.some((phrase) => lower.includes(phrase.toLowerCase()))
}

/** Get brand guidelines text to append to prompt (if set). */
export async function getBrandGuidelines(tenantId: string): Promise<string> {
  const settings = await prismaWithRetry(() =>
    prisma.tenantAIImageSettings.findUnique({
      where: { tenantId },
      select: { brandGuidelines: true },
    })
  )
  const text = settings?.brandGuidelines?.trim()
  return text ? ` ${text}` : ''
}

/** Get cached image URL if same params exist for tenant. */
export async function getCachedImageUrl(
  tenantId: string,
  paramsHash: string
): Promise<string | null> {
  const row = await prismaWithRetry(() =>
    prisma.aIGeneratedImageCache.findUnique({
      where: { tenantId_paramsHash: { tenantId, paramsHash } },
      select: { imageUrl: true },
    })
  )
  return row?.imageUrl ?? null
}

/** Store generated image URL in cache. */
export async function setCachedImage(
  tenantId: string,
  paramsHash: string,
  imageUrl: string
): Promise<void> {
  await prismaWithRetry(() =>
    prisma.aIGeneratedImageCache.upsert({
      where: { tenantId_paramsHash: { tenantId, paramsHash } },
      create: { tenantId, paramsHash, imageUrl },
      update: { imageUrl },
    })
  )
}

/** Log one image generation for audit and rate-limit count. */
export async function logImageGeneration(params: {
  tenantId: string
  userId: string
  prompt: string
  params?: Record<string, unknown>
  imageUrl?: string
  cached: boolean
}): Promise<void> {
  await prismaWithRetry(() =>
    prisma.aIImageGenerationLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        prompt: params.prompt,
        params: params.params ?? undefined,
        imageUrl: params.imageUrl ?? undefined,
        cached: params.cached,
      },
    })
  )
}

/** Record prompt in history (recent list; optionally saved). */
export async function recordPromptHistory(params: {
  tenantId: string
  userId: string
  prompt: string
  isSaved?: boolean
}): Promise<void> {
  await prismaWithRetry(() =>
    prisma.aIPromptHistory.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        prompt: params.prompt,
        isSaved: params.isSaved ?? false,
      },
    })
  )
}
