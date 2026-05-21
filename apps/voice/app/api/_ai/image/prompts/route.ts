import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { recordPromptHistory } from '@/lib/ai/image-studio'
import { z } from 'zod'

const RECENT_LIMIT = 20

/**
 * GET /api/ai/image/prompts
 * Returns recent prompts (last 20) and saved prompts for the current user.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const [recent, saved] = await Promise.all([
      prismaWithRetry(() =>
        prisma.aIPromptHistory.findMany({
          where: { tenantId, userId },
          orderBy: { createdAt: 'desc' },
          take: RECENT_LIMIT,
          select: { id: true, prompt: true, isSaved: true, createdAt: true },
        })
      ),
      prismaWithRetry(() =>
        prisma.aIPromptHistory.findMany({
          where: { tenantId, userId, isSaved: true },
          orderBy: { createdAt: 'desc' },
          select: { id: true, prompt: true, createdAt: true },
        })
      ),
    ])

    return NextResponse.json({ recent, saved })
  } catch (err) {
    return handleLicenseError(err)
  }
}

const savePromptSchema = z.object({
  prompt: z.string().min(1),
  isSaved: z.boolean().optional(),
})

/**
 * POST /api/ai/image/prompts
 * Record a prompt in history (e.g. after generation). Optionally mark as saved.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')
    const body = await request.json()
    const { prompt, isSaved } = savePromptSchema.parse(body)

    await recordPromptHistory({ tenantId, userId, prompt, isSaved: isSaved ?? false })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
    }
    return handleLicenseError(err)
  }
}

const updatePromptSchema = z.object({
  id: z.string().min(1),
  isSaved: z.boolean(),
})

/**
 * PATCH /api/ai/image/prompts
 * Toggle saved state of a prompt (pin/unpin).
 */
export async function PATCH(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')
    const body = await request.json()
    const { id, isSaved } = updatePromptSchema.parse(body)

    await prismaWithRetry(() =>
      prisma.aIPromptHistory.updateMany({
        where: { id, tenantId, userId },
        data: { isSaved },
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
