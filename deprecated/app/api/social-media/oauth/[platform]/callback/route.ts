import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { cookies } from 'next/headers'

/**
 * OAuth callback endpoint for social media platforms
 * GET /api/social-media/oauth/[platform]/callback - Handle OAuth callback
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'OAuth authorization failed'
      return NextResponse.redirect(
        `/dashboard/marketing/social?error=${encodeURIComponent(errorDescription)}`
      )
    }

    // Validate state (CSRF protection)
    const cookieStore = await cookies()
    const storedState = cookieStore.get(`oauth_state_${platform}`)?.value
    const tenantId = cookieStore.get(`oauth_tenant_${platform}`)?.value

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `/dashboard/marketing/social?error=${encodeURIComponent('Invalid state parameter')}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `/dashboard/marketing/social?error=${encodeURIComponent('Missing authorization code')}`
      )
    }

    if (!tenantId) {
      return NextResponse.redirect(
        `/dashboard/marketing/social?error=${encodeURIComponent('Session expired')}`
      )
    }

    // Exchange code for access token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/social-media/oauth/${platform}/callback`
    
    const tokenData = await exchangeCodeForToken(platform, code, redirectUri)

    // Get account information from platform
    const accountInfo = await getAccountInfo(platform, tokenData.access_token)

    // Save account connection to database
    const account = await prisma.socialMediaAccount.upsert({
      where: {
        tenantId_platform_accountId: {
          tenantId: tenantId,
          platform: platform.toLowerCase(),
          accountId: accountInfo.accountId || accountInfo.id || platform,
        },
      },
      update: {
        accessToken: tokenData.access_token, // In production, encrypt this
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at) : null,
        isConnected: true,
        accountName: accountInfo.name || accountInfo.username || `${platform} Account`,
        lastSyncAt: new Date(),
      },
      create: {
        tenantId: tenantId,
        platform: platform.toLowerCase(),
        accountId: accountInfo.accountId || accountInfo.id || platform,
        accountName: accountInfo.name || accountInfo.username || `${platform} Account`,
        accessToken: tokenData.access_token, // In production, encrypt this
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at) : null,
        isConnected: true,
        followerCount: accountInfo.followerCount || 0,
        lastSyncAt: new Date(),
      },
    })

    // Clear OAuth cookies
    const response = NextResponse.redirect('/dashboard/marketing/social?connected=true')
    response.cookies.delete(`oauth_state_${platform}`)
    response.cookies.delete(`oauth_tenant_${platform}`)

    return response
  } catch (error: any) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `/dashboard/marketing/social?error=${encodeURIComponent(error.message || 'OAuth callback failed')}`
    )
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string
): Promise<{
  access_token: string
  refresh_token?: string
  expires_at?: number
}> {
  const clientId = getClientId(platform)
  const clientSecret = getClientSecret(platform)

  switch (platform.toLowerCase()) {
    case 'facebook':
    case 'instagram':
      const fbResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code: code,
        }),
      })
      if (!fbResponse.ok) {
        const error = await fbResponse.json()
        throw new Error(error.error?.message || 'Failed to exchange code for token')
      }
      const fbData = await fbResponse.json()
      return {
        access_token: fbData.access_token,
        expires_at: Date.now() + (fbData.expires_in * 1000),
      }

    case 'linkedin':
      const liResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      })
      if (!liResponse.ok) {
        const error = await liResponse.json()
        throw new Error(error.error_description || 'Failed to exchange code for token')
      }
      const liData = await liResponse.json()
      return {
        access_token: liData.access_token,
        expires_at: Date.now() + (liData.expires_in * 1000),
      }

    case 'twitter':
    case 'x':
      const twResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: 'challenge', // In production, use PKCE properly
        }),
      })
      if (!twResponse.ok) {
        const error = await twResponse.json()
        throw new Error(error.error_description || 'Failed to exchange code for token')
      }
      const twData = await twResponse.json()
      return {
        access_token: twData.access_token,
        refresh_token: twData.refresh_token,
        expires_at: Date.now() + (twData.expires_in * 1000),
      }

    case 'youtube':
      const ytResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code: code,
          grant_type: 'authorization_code',
        }),
      })
      if (!ytResponse.ok) {
        const error = await ytResponse.json()
        throw new Error(error.error_description || 'Failed to exchange code for token')
      }
      const ytData = await ytResponse.json()
      return {
        access_token: ytData.access_token,
        refresh_token: ytData.refresh_token,
        expires_at: Date.now() + (ytData.expires_in * 1000),
      }

    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

/**
 * Get account information from platform API
 */
async function getAccountInfo(platform: string, accessToken: string): Promise<{
  id: string
  accountId?: string
  name?: string
  username?: string
  followerCount?: number
}> {
  switch (platform.toLowerCase()) {
    case 'facebook':
      const fbMe = await fetch('https://graph.facebook.com/v18.0/me?fields=id,name', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!fbMe.ok) throw new Error('Failed to get Facebook account info')
      const fbData = await fbMe.json()
      return { id: fbData.id, name: fbData.name }

    case 'instagram':
      const igMe = await fetch('https://graph.facebook.com/v18.0/me?fields=id,username', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!igMe.ok) throw new Error('Failed to get Instagram account info')
      const igData = await igMe.json()
      return { id: igData.id, username: igData.username }

    case 'linkedin':
      const liMe = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!liMe.ok) throw new Error('Failed to get LinkedIn account info')
      const liData = await liMe.json()
      return { id: liData.id, name: `${liData.localizedFirstName} ${liData.localizedLastName}` }

    case 'twitter':
    case 'x':
      const twMe = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!twMe.ok) throw new Error('Failed to get Twitter account info')
      const twData = await twMe.json()
      return { id: twData.data.id, username: twData.data.username, name: twData.data.name }

    case 'youtube':
      const ytMe = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!ytMe.ok) throw new Error('Failed to get YouTube account info')
      const ytData = await ytMe.json()
      const channel = ytData.items[0]
      return {
        id: channel.id,
        name: channel.snippet.title,
        followerCount: parseInt(channel.statistics?.subscriberCount || '0'),
      }

    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

function getClientId(platform: string): string {
  const envKey = `SOCIAL_MEDIA_${platform.toUpperCase()}_CLIENT_ID`
  const clientId = process.env[envKey]
  if (!clientId) {
    throw new Error(`OAuth client ID not configured for ${platform}. Set ${envKey} environment variable.`)
  }
  return clientId
}

function getClientSecret(platform: string): string {
  const envKey = `SOCIAL_MEDIA_${platform.toUpperCase()}_CLIENT_SECRET`
  const clientSecret = process.env[envKey]
  if (!clientSecret) {
    throw new Error(`OAuth client secret not configured for ${platform}. Set ${envKey} environment variable.`)
  }
  return clientSecret
}

