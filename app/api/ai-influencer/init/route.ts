/**
 * Initialize AI Influencer Marketing module
 * Call this endpoint once on server startup or manually
 */

import { NextRequest, NextResponse } from 'next/server'
import { initializeAIInfluencerModule, getDependencyStatus } from '@/lib/ai-influencer/setup'
import { checkTemplatesAvailable } from '@/lib/ai-influencer/template-fallback'

/**
 * POST /api/ai-influencer/init
 * Initialize the AI Influencer Marketing module
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize module
    await initializeAIInfluencerModule()

    // Get dependency status
    const dependencies = await getDependencyStatus()
    const templates = checkTemplatesAvailable()

    return NextResponse.json({
      success: true,
      message: 'AI Influencer Marketing module initialized',
      dependencies,
      templates,
    })
  } catch (error) {
    console.error('Initialization error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize module',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai-influencer/init
 * Check initialization status and dependencies
 */
export async function GET(request: NextRequest) {
  try {
    const dependencies = await getDependencyStatus()
    const templates = checkTemplatesAvailable()

    return NextResponse.json({
      initialized: true,
      dependencies,
      templates,
      ready: dependencies.ffmpeg && templates.available > 0,
    })
  } catch (error) {
    return NextResponse.json(
      {
        initialized: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

