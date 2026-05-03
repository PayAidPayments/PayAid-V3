import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { enforceIntegrationRateLimit } from '@/lib/integrations/security'
import crypto from 'crypto'

function toBase64Url(input: Buffer) {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export async function GET(request: NextRequest) {
  const limited = enforceIntegrationRateLimit(request, {
    key: 'integration:oauth:twitter:connect',
    limit: 8,
    windowMs: 60_000,
  })
  if (limited) return limited

  try {
    await assertIntegrationPermission(request, 'configure')
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const clientId = process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID || ''
    if (!clientId) {
      return NextResponse.json({ error: 'X OAuth is not configured (missing TWITTER_CLIENT_ID).' }, { status: 400 })
    }
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/twitter/callback`
    const state = `${tenantId}:${userId}:twitter`
    const codeVerifier = toBase64Url(crypto.randomBytes(48))
    const codeChallenge = toBase64Url(crypto.createHash('sha256').update(codeVerifier).digest())
    const authUrl = `https://twitter.com/i/oauth2/authorize?${new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })}`

    await writeIntegrationAudit({
      tenantId,
      userId,
      entityType: 'integration_social',
      entityId: `${tenantId}:twitter`,
      action: 'twitter_oauth_connect_initiated',
      after: { provider: 'twitter' },
    })

    const response = NextResponse.json({ success: true, data: { authUrl, state } })
    response.cookies.set('twitter_oauth_pkce_verifier', codeVerifier, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 10,
    })
    return response
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    return handleLicenseError(error)
  }
}
