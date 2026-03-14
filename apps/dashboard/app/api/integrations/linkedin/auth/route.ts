import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { LinkedInService } from '@/lib/integrations/social-media'

/**
 * GET /api/integrations/linkedin/auth
 * Get LinkedIn OAuth authorization URL
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    // Get LinkedIn config from tenant settings
    const linkedInConfig = {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/linkedin/callback`,
    }

    if (!linkedInConfig.clientId) {
      return NextResponse.json(
        { error: 'LinkedIn integration not configured' },
        { status: 400 }
      )
    }

    const service = new LinkedInService(linkedInConfig)
    const state = `${tenantId}:${userId}`
    const authUrl = service.getAuthorizationUrl(state)

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        state,
      },
    })
  } catch (error) {
    console.error('[LinkedIn Auth] Error:', error)
    return handleLicenseError(error)
  }
}
