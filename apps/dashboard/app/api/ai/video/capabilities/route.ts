import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getVideoQueueUrl } from '@payaid/ai'

type WorkerMode = 'dynamic' | 'local-fallback' | 'unconfigured'

function detectWorkerMode(url: string | null): WorkerMode {
  if (!url) return 'unconfigured'
  const normalized = url.trim().toLowerCase()
  if (
    normalized.includes('/api/ai/video/queue') ||
    normalized.includes('localhost') ||
    normalized.includes('127.0.0.1')
  ) {
    return 'local-fallback'
  }
  return 'dynamic'
}

export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'marketing')
    const queueUrl = getVideoQueueUrl()
    const mode = detectWorkerMode(queueUrl)
    return NextResponse.json({
      configured: Boolean(queueUrl),
      mode,
      label:
        mode === 'dynamic'
          ? 'Dynamic worker'
          : mode === 'local-fallback'
            ? 'Local fallback'
            : 'Not configured',
      details:
        mode === 'dynamic'
          ? 'Advanced video options are likely active.'
          : mode === 'local-fallback'
            ? 'Single-image motion clip (Ken Burns style).'
            : 'Set AI_VIDEO_QUEUE_URL to enable video generation.',
    })
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    return NextResponse.json({ error: 'Failed to read video capabilities' }, { status: 500 })
  }
}
