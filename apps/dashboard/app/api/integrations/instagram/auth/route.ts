import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { enforceIntegrationRateLimit } from '@/lib/integrations/security'

export async function GET(request: NextRequest) {
  const limited = enforceIntegrationRateLimit(request, {
    key: 'integration:oauth:instagram:connect',
    limit: 8,
    windowMs: 60_000,
  })
  if (limited) return limited

  try {
    await assertIntegrationPermission(request, 'configure')
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const appId = process.env.META_APP_ID || ''
    if (!appId) {
      return NextResponse.json({ error: 'Instagram OAuth is not configured (missing META_APP_ID).' }, { status: 400 })
    }
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/instagram/callback`
    const state = `${tenantId}:${userId}:instagram`
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope:
        'public_profile,email,instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management',
      state,
    })}`

    await writeIntegrationAudit({
      tenantId,
      userId,
      entityType: 'integration_social',
      entityId: `${tenantId}:instagram`,
      action: 'instagram_oauth_connect_initiated',
      after: { provider: 'instagram' },
    })

    return NextResponse.json({ success: true, data: { authUrl, state } })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    return handleLicenseError(error)
  }
}
