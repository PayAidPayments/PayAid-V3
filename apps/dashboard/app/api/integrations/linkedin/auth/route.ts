import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { LinkedInService } from '@/lib/integrations/social-media'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { enforceIntegrationRateLimit } from '@/lib/integrations/security'

/**
 * GET /api/integrations/linkedin/auth
 * Get LinkedIn OAuth authorization URL
 */
export async function GET(request: NextRequest) {
  const limited = enforceIntegrationRateLimit(request, {
    key: 'integration:oauth:linkedin:connect',
    limit: 8,
    windowMs: 60_000,
  })
  if (limited) return limited

  try {
    await assertIntegrationPermission(request, 'configure')
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
    // Request posting scope so connected tokens can publish from Studio.
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
      response_type: 'code',
      client_id: linkedInConfig.clientId,
      redirect_uri: linkedInConfig.redirectUri,
      state,
      scope: 'r_liteprofile r_emailaddress w_member_social offline_access',
    })}`

    await writeIntegrationAudit({
      tenantId,
      userId,
      entityType: 'integration_social',
      entityId: `${tenantId}:linkedin`,
      action: 'linkedin_oauth_connect_initiated',
      after: { provider: 'linkedin' },
    })

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        state,
      },
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    console.error('[LinkedIn Auth] Error:', error)
    return handleLicenseError(error)
  }
}
