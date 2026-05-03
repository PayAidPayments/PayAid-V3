import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { enforceIntegrationRateLimit } from '@/lib/integrations/security'

export async function GET(request: NextRequest) {
  const limited = enforceIntegrationRateLimit(request, {
    key: 'integration:oauth:youtube:connect',
    limit: 8,
    windowMs: 60_000,
  })
  if (limited) return limited

  try {
    await assertIntegrationPermission(request, 'configure')
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const clientId = process.env.GOOGLE_CLIENT_ID || ''
    if (!clientId) {
      return NextResponse.json({ error: 'YouTube OAuth is not configured (missing GOOGLE_CLIENT_ID).' }, { status: 400 })
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/youtube/callback`
    const state = `${tenantId}:${userId}:youtube`
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope:
        'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
      state,
    })}`

    await writeIntegrationAudit({
      tenantId,
      userId,
      entityType: 'integration_social',
      entityId: `${tenantId}:youtube`,
      action: 'youtube_oauth_connect_initiated',
      after: { provider: 'youtube' },
    })

    return NextResponse.json({
      success: true,
      data: { authUrl, state },
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    return handleLicenseError(error)
  }
}
