import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'
import { prismaWithRetry } from '@/lib/db/connection-retry'

const HISTORY_LIMIT = 20

/**
 * GET /api/ai/image/history
 * Returns last 20 image generations for the tenant (for Image Studio history panel).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const history = await prismaWithRetry(() =>
      prisma.aIImageGenerationLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_LIMIT,
        select: {
          id: true,
          prompt: true,
          imageUrl: true,
          cached: true,
          createdAt: true,
        },
      })
    )

    return NextResponse.json({ history })
  } catch (err) {
    return handleLicenseError(err)
  }
}
