import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { z } from 'zod'

/**
 * GET /api/ai/image/settings
 * Returns tenant AI image settings (blocklist, brand guidelines, daily limit override).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const settings = await prismaWithRetry(() =>
      prisma.tenantAIImageSettings.findUnique({
        where: { tenantId },
        select: {
          promptBlocklist: true,
          brandGuidelines: true,
          dailyLimitOverride: true,
        },
      })
    )

    return NextResponse.json({
      promptBlocklist: settings?.promptBlocklist ?? [],
      brandGuidelines: settings?.brandGuidelines ?? null,
      dailyLimitOverride: settings?.dailyLimitOverride ?? null,
    })
  } catch (err) {
    return handleLicenseError(err)
  }
}

const updateSchema = z.object({
  promptBlocklist: z.array(z.string()).optional(),
  brandGuidelines: z.string().nullable().optional(),
  dailyLimitOverride: z.number().int().min(0).nullable().optional(),
})

/**
 * PATCH /api/ai/image/settings
 * Update tenant AI image settings (admin or tenant admin).
 */
export async function PATCH(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const body = await request.json()
    const data = updateSchema.parse(body)

    await prismaWithRetry(() =>
      prisma.tenantAIImageSettings.upsert({
        where: { tenantId },
        create: {
          tenantId,
          promptBlocklist: data.promptBlocklist ?? [],
          brandGuidelines: data.brandGuidelines ?? null,
          dailyLimitOverride: data.dailyLimitOverride ?? null,
        },
        update: {
          ...(data.promptBlocklist !== undefined && { promptBlocklist: data.promptBlocklist }),
          ...(data.brandGuidelines !== undefined && { brandGuidelines: data.brandGuidelines }),
          ...(data.dailyLimitOverride !== undefined && { dailyLimitOverride: data.dailyLimitOverride }),
        },
      })
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
    }
    return handleLicenseError(err)
  }
}
