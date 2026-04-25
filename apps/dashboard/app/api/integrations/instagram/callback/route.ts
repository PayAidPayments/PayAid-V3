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
    const appId = process.env.META_APP_ID || ''
    const appSecret = process.env.META_APP_SECRET || ''
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/instagram/callback`
    if (!appId || !appSecret) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/${tenantId}/Integrations/Social?error=instagram_not_configured`)
    }

    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
    tokenUrl.searchParams.set('client_id', appId)
    tokenUrl.searchParams.set('client_secret', appSecret)
    tokenUrl.searchParams.set('redirect_uri', redirectUri)
    tokenUrl.searchParams.set('code', code)
    const tokenRes = await fetch(tokenUrl.toString())
    const tokenJson: any = await tokenRes.json().catch(() => ({}))
    if (!tokenRes.ok || !tokenJson?.access_token) {
      throw new Error(tokenJson?.error?.message || 'Failed to obtain Instagram access token')
    }

    const accessToken = tokenJson.access_token as string
    const expiresIn = Number(tokenJson.expires_in || 0)
    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null

    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`
    )
    const profile: any = profileRes.ok ? await profileRes.json().catch(() => ({})) : {}

    await prisma.oAuthIntegration.upsert({
      where: { tenantId_provider: { tenantId, provider: 'instagram' } },
      create: {
        tenantId,
        provider: 'instagram',
        accessToken: encrypt(accessToken),
        refreshToken: null,
        expiresAt,
        tokenType: 'Bearer',
        scope: tokenJson.scope || null,
        providerUserId: profile?.id || null,
        providerEmail: profile?.email || null,
        providerName: profile?.name || null,
        providerAvatarUrl: profile?.picture?.data?.url || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
      update: {
        accessToken: encrypt(accessToken),
        expiresAt,
        tokenType: 'Bearer',
        scope: tokenJson.scope || null,
        providerUserId: profile?.id || null,
        providerEmail: profile?.email || null,
        providerName: profile?.name || null,
        providerAvatarUrl: profile?.picture?.data?.url || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
    })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/${tenantId}/Integrations/Social?success=instagram_connected`)
  } catch (error) {
    console.error('[Instagram Callback] Error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`)
  }
}
