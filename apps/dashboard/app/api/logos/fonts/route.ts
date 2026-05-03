import { NextRequest, NextResponse } from 'next/server'
import { vectorLogoEngine } from '@/lib/logo/vector-engine'

/**
 * GET /api/logos/fonts
 * List all available fonts for logo generation
 */
export async function GET(_request: NextRequest) {
  try {
    const fonts = await vectorLogoEngine.getAvailableFonts()

    return NextResponse.json({
      fonts,
      count: fonts.length,
    })
  } catch (error) {
    console.error('[Fonts API] Error loading fonts:', error)
    return NextResponse.json(
      {
        error: 'Failed to load fonts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
