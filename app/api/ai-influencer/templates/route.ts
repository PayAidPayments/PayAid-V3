/**
 * GET /api/ai-influencer/templates
 * Get available video templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { VIDEO_TEMPLATES, getTemplatesForStyle } from '@/lib/ai-influencer/video-templates'
import { templateExists } from '@/lib/ai-influencer/template-fallback'

/**
 * GET /api/ai-influencer/templates
 * List all available video templates
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const style = searchParams.get('style') as 'testimonial' | 'demo' | 'problem-solution' | null
    const gender = searchParams.get('gender')

    let templates = VIDEO_TEMPLATES

    // Filter by style if provided
    if (style) {
      templates = getTemplatesForStyle(style, gender || undefined)
    } else if (gender) {
      templates = templates.filter(
        (t) => t.gender === gender || t.gender === 'both'
      )
    }

    // Add availability status
    const templatesWithStatus = templates.map((template) => ({
      ...template,
      available: templateExists(template),
    }))

    // Group by style
    const grouped = templatesWithStatus.reduce((acc, template) => {
      if (!acc[template.style]) {
        acc[template.style] = []
      }
      acc[template.style].push(template)
      return acc
    }, {} as Record<string, typeof templatesWithStatus>)

    return NextResponse.json({
      templates: templatesWithStatus,
      grouped,
      total: templatesWithStatus.length,
      available: templatesWithStatus.filter((t) => t.available).length,
    })
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    )
  }
}

