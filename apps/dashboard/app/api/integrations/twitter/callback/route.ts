import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { encrypt } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`)
    }

    const [tenantId] = state.split(':')
    const clientId = process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID || ''
    const clientSecret = process.env.TWITTER_CLIENT_SECRET || process.env.X_CLIENT_SECRET || ''
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/twitter/callback`
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/${tenantId}/Integrations/Social?error=twitter_not_configured`)
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const codeVerifier = request.cookies.get('twitter_oauth_pkce_verifier')?.value
    if (!codeVerifier) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/${tenantId}/Integrations/Social?error=twitter_pkce_missing`
      )
    }
    const tokenRes = await fetch('https://api.x.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    })
    const tokenJson: any = await tokenRes.json().catch(() => ({}))
    if (!tokenRes.ok || !tokenJson?.access_token) {
      throw new Error(tokenJson?.error_description || tokenJson?.error || 'Failed to obtain X access token')
    }

    const accessToken = tokenJson.access_token as string
    const refreshToken = tokenJson.refresh_token || null
    const expiresIn = Number(tokenJson.expires_in || 0)
    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null

    const profileRes = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url,name,username', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const profileJson: any = profileRes.ok ? await profileRes.json().catch(() => ({})) : {}
    const user = profileJson?.data || {}

    await prisma.oAuthIntegration.upsert({
      where: { tenantId_provider: { tenantId, provider: 'twitter' } },
      create: {
        tenantId,
        provider: 'twitter',
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        expiresAt,
        tokenType: tokenJson.token_type || 'Bearer',
        scope: tokenJson.scope || null,
        providerUserId: user?.id || null,
        providerEmail: null,
        providerName: user?.name || user?.username || null,
        providerAvatarUrl: user?.profile_image_url || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
      update: {
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : undefined,
        expiresAt,
        tokenType: tokenJson.token_type || 'Bearer',
        scope: tokenJson.scope || null,
        providerUserId: user?.id || null,
        providerName: user?.name || user?.username || null,
        providerAvatarUrl: user?.profile_image_url || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
    })

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/${tenantId}/Integrations/Social?success=twitter_connected`
    )
    response.cookies.set('twitter_oauth_pkce_verifier', '', { path: '/', maxAge: 0 })
    return response
  } catch (error) {
    console.error('[Twitter Callback] Error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`)
  }
}
