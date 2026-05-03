import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import crypto from 'crypto'

/**
 * OAuth initiation endpoint for social media platforms
 * GET /api/social-media/oauth/[platform] - Initiate OAuth flow
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'marketing')
    const { platform } = await params

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/social-media/oauth/${platform}/callback`

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex')
    
    // Store state in cookie (in production, use Redis or session storage)
    const response = NextResponse.redirect(getOAuthUrl(platform, redirectUri, state))
    response.cookies.set(`oauth_state_${platform}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })
    response.cookies.set(`oauth_tenant_${platform}`, tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    })

    return response
  } catch (error: any) {
    console.error('OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}

/**
 * Get OAuth authorization URL for each platform
 */
function getOAuthUrl(platform: string, redirectUri: string, state: string): string {
  const clientId = getClientId(platform)
  const scopes = getScopes(platform)

  switch (platform.toLowerCase()) {
    case 'facebook':
      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}&response_type=code`
    
    case 'instagram':
      // Instagram uses Facebook OAuth
      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}&response_type=code`
    
    case 'linkedin':
      return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}`
    
    case 'twitter':
    case 'x':
      // Twitter/X uses OAuth 2.0
      return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}&code_challenge=challenge&code_challenge_method=plain`
    
    case 'youtube':
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}&response_type=code&access_type=offline&prompt=consent`
    
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

/**
 * Get OAuth client ID for each platform from environment variables
 */
function getClientId(platform: string): string {
  const envKey = `SOCIAL_MEDIA_${platform.toUpperCase()}_CLIENT_ID`
  const clientId = process.env[envKey]
  
  if (!clientId) {
    throw new Error(`OAuth client ID not configured for ${platform}. Set ${envKey} environment variable.`)
  }
  
  return clientId
}

/**
 * Get required OAuth scopes for each platform
 */
function getScopes(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return 'pages_manage_posts,pages_read_engagement,pages_show_list'
    case 'instagram':
      return 'instagram_basic,instagram_content_publish,pages_show_list'
    case 'linkedin':
      return 'w_member_social,r_liteprofile,r_emailaddress'
    case 'twitter':
    case 'x':
      return 'tweet.read tweet.write users.read offline.access'
    case 'youtube':
      return 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly'
    default:
      return 'read'
  }
}

