import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import {
  getImageDailyLimit,
  getTodayImageCount,
  getLimitResetAt,
} from '@/lib/ai/image-studio'

/**
 * GET /api/ai/image/limits
 * Returns rate limit info for the current tenant (for UI and headers).
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const limit = await getImageDailyLimit(tenantId)
    const used = await getTodayImageCount(tenantId)
    const remaining = Math.max(0, limit - used)
    const resetAt = getLimitResetAt()

    const res = NextResponse.json({
      limit,
      used,
      remaining,
      resetAt: resetAt.toISOString(),
    })
    res.headers.set('X-Remaining-Images-Today', String(remaining))
    res.headers.set('X-Limit-Reset', resetAt.toISOString())
    res.headers.set('X-Image-Daily-Limit', String(limit))
    return res
  } catch (err) {
    return handleLicenseError(err)
  }
}
