/**
 * Health check endpoint for AI Influencer Marketing
 * Returns system status and readiness
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDependencyStatus } from '@/lib/ai-influencer/setup'
import { checkTemplatesAvailable } from '@/lib/ai-influencer/template-fallback'

/**
 * GET /api/ai-influencer/health
 * Check system health and readiness
 */
export async function GET(request: NextRequest) {
  try {
    const dependencies = await getDependencyStatus()
    const templates = checkTemplatesAvailable()

    const isReady = dependencies.ffmpeg && templates.available > 0

    return NextResponse.json({
      status: isReady ? 'ready' : 'not-ready',
      ready: isReady,
      dependencies: {
        ffmpeg: {
          installed: dependencies.ffmpeg,
          required: true,
          message: dependencies.ffmpeg
            ? 'FFmpeg is installed'
            : 'FFmpeg is required for video generation',
        },
        rhubarb: {
          installed: dependencies.rhubarb,
          required: false,
          message: dependencies.rhubarb
            ? 'Rhubarb Lip Sync is installed'
            : 'Rhubarb is optional (uses placeholder if not installed)',
        },
      },
      templates: {
        available: templates.available,
        total: templates.total,
        missing: templates.missing,
        message:
          templates.available === templates.total
            ? 'All templates available'
            : `${templates.available}/${templates.total} templates available`,
      },
      message: isReady
        ? 'System is ready for video generation'
        : 'System is not ready. Check dependencies and templates.',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        ready: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

