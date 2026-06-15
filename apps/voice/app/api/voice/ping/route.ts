/**
 * POST /api/voice/ping — no-op warm-up for RealTimeVoiceDemo (optional).
 */
import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'ai-studio')
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleLicenseError(error)
  }
}
