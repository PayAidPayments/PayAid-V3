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
    const clientId = process.env.GOOGLE_CLIENT_ID || ''
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/youtube/callback`
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/${tenantId}/Integrations/Social?error=youtube_not_configured`)
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokenJson: any = await tokenRes.json().catch(() => ({}))
    if (!tokenRes.ok || !tokenJson?.access_token) {
      throw new Error(tokenJson?.error_description || tokenJson?.error || 'Failed to obtain YouTube access token')
    }

    const accessToken = tokenJson.access_token as string
    const refreshToken = tokenJson.refresh_token || null
    const expiresIn = Number(tokenJson.expires_in || 0)
    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const profile: any = profileRes.ok ? await profileRes.json().catch(() => ({})) : {}

    await prisma.oAuthIntegration.upsert({
      where: { tenantId_provider: { tenantId, provider: 'youtube' } },
      create: {
        tenantId,
        provider: 'youtube',
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        expiresAt,
        tokenType: tokenJson.token_type || 'Bearer',
        scope: tokenJson.scope || null,
        providerUserId: profile?.id || null,
        providerEmail: profile?.email || null,
        providerName: profile?.name || profile?.given_name || null,
        providerAvatarUrl: profile?.picture || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
      update: {
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : undefined,
        expiresAt,
        tokenType: tokenJson.token_type || 'Bearer',
        scope: tokenJson.scope || null,
        providerUserId: profile?.id || null,
        providerEmail: profile?.email || null,
        providerName: profile?.name || profile?.given_name || null,
        providerAvatarUrl: profile?.picture || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
    })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/${tenantId}/Integrations/Social?success=youtube_connected`)
  } catch (error) {
    console.error('[YouTube Callback] Error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`)
  }
}
