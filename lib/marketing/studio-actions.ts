// @ts-nocheck — references Prisma models not yet in schema (marketing channel stack).
'use server'

import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Stub: creates a ContentItem + placeholder MediaAsset for the tenant library.
 * Replace with real AI pipeline + storage URLs when integrations land.
 */
export async function saveStudioDraftToLibrary(input: {
  tenantId: string
  goal: string
  channels: string[]
  prompt: string
  /** When set, persisted as ContentItem.body instead of raw prompt only. */
  generatedCopyByChannel?: Record<string, string>
  /** First real image URL replaces placeholder media row when provided. */
  imageUrls?: string[]
  /** Optional metadata for Library / audits (image placement, preset, brand hints). */
  imageMeta?: {
    useCaseLabel?: string
    placementNotes?: string
    presetId?: string
    negativePrompt?: string
    brandColors?: string
    brandLogoUrl?: string
    lastProvider?: string
  }
}) {
  const { tenantId, goal, channels, prompt, generatedCopyByChannel, imageUrls, imageMeta } = input
  if (!tenantId?.trim()) {
    return { ok: false as const, error: 'Missing tenant' }
  }

  const title =
    prompt.trim().slice(0, 80) || `Studio draft · ${new Date().toISOString().slice(0, 10)}`

  const metaBlock =
    imageMeta &&
    (imageMeta.useCaseLabel ||
      imageMeta.placementNotes ||
      imageMeta.presetId ||
      imageMeta.lastProvider ||
      imageMeta.negativePrompt ||
      imageMeta.brandColors ||
      imageMeta.brandLogoUrl)
      ? [
          '',
          '---',
          '**Image creative metadata**',
          imageMeta.useCaseLabel ? `Use case: ${imageMeta.useCaseLabel}` : '',
          imageMeta.placementNotes ? `Placement: ${imageMeta.placementNotes}` : '',
          imageMeta.presetId ? `Preset: ${imageMeta.presetId}` : '',
          imageMeta.lastProvider ? `Provider: ${imageMeta.lastProvider}` : '',
          imageMeta.brandColors ? `Brand colors: ${imageMeta.brandColors}` : '',
          imageMeta.brandLogoUrl ? `Logo URL hint: ${imageMeta.brandLogoUrl}` : '',
          imageMeta.negativePrompt ? `Negative prompt: ${imageMeta.negativePrompt}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      : ''

  const body =
    generatedCopyByChannel && Object.keys(generatedCopyByChannel).length > 0
      ? [
          `Brief: ${prompt.trim()}`,
          '',
          ...Object.entries(generatedCopyByChannel).map(([ch, text]) => `**${ch}**\n${text}`),
          metaBlock,
        ]
          .join('\n\n')
          .slice(0, 20000)
      : [prompt.slice(0, 20000), metaBlock].filter(Boolean).join('\n\n').slice(0, 20000)

  const primaryImageUrl = imageUrls?.find((u) => u?.startsWith('http')) ?? null

  await prisma.$transaction([
    prisma.contentItem.create({
      data: {
        tenantId,
        title,
        body,
        type: 'studio_draft',
        channels: channels.length ? channels : ['email'],
        goal: goal || null,
      },
    }),
    prisma.mediaAsset.create({
      data: {
        tenantId,
        url: primaryImageUrl ?? `placeholder://marketing-studio/${Date.now()}`,
        type: 'image',
        tags: ['studio', 'draft', ...channels.slice(0, 5)],
      },
    }),
  ])

  revalidatePath(`/marketing/${tenantId}/library`)
  return { ok: true as const }
}
