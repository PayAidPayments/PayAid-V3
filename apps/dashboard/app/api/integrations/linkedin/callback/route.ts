import { NextRequest, NextResponse } from 'next/server'
import { LinkedInService } from '@/lib/integrations/social-media'
import { prisma } from '@/lib/db/prisma'
import { encrypt } from '@/lib/encryption'

/**
 * GET /api/integrations/linkedin/callback
 * LinkedIn OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`)
    }

    const [tenantId, userId] = state.split(':')

    const linkedInConfig = {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/linkedin/callback`,
    }

    const service = new LinkedInService(linkedInConfig)
    const tokenJson: any = await service.exchangeAuthorizationCode(code)
    const accessToken = tokenJson?.access_token
    if (!accessToken) {
      throw new Error('Failed to obtain LinkedIn access token')
    }
    const refreshToken = tokenJson?.refresh_token || null
    const expiresIn = Number(tokenJson?.expires_in || 0)
    const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null
    const profile = await service.getProfile(accessToken).catch(() => null)

    await prisma.oAuthIntegration.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: 'linkedin',
        },
      },
      create: {
        tenantId,
        provider: 'linkedin',
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        expiresAt,
        tokenType: 'Bearer',
        providerUserId: profile?.id || null,
        providerEmail: profile?.email || null,
        providerName: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || null,
        providerAvatarUrl: profile?.profilePicture || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
      update: {
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : undefined,
        expiresAt,
        tokenType: 'Bearer',
        providerUserId: profile?.id || null,
        providerEmail: profile?.email || null,
        providerName: [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || null,
        providerAvatarUrl: profile?.profilePicture || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
    })

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/${tenantId}/Integrations/Social?success=linkedin_connected`)
  } catch (error) {
    console.error('[LinkedIn Callback] Error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`)
  }
}
