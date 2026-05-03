import { NextRequest, NextResponse } from 'next/server'

// OAuth2 configuration
const CORE_AUTH_URL = process.env.CORE_AUTH_URL || 'https://payaid.io'
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || ''
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || ''

/**
 * Redirect user to core for authentication
 */
function redirectToAuth(returnUrl: string): NextResponse {
  const authUrl = new URL(`${CORE_AUTH_URL}/api/oauth/authorize`)
  authUrl.searchParams.set('client_id', OAUTH_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', returnUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid profile email')
  
  return NextResponse.redirect(authUrl.toString())
}

/**
 * Exchange authorization code for access token and refresh token
 */
async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token?: string }> {
  const tokenUrl = `${CORE_AUTH_URL}/api/oauth/token`
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: OAUTH_CLIENT_ID,
      client_secret: OAUTH_CLIENT_SECRET,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to exchange code for token')
  }
  
  const data = await response.json()
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  }
}

/**
 * Set token in response cookie
 */
function setTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set('payaid_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: '.payaid.io',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

/**
 * Set refresh token in response cookie
 */
function setRefreshTokenCookie(response: NextResponse, refreshToken: string): void {
  response.cookies.set('payaid_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: '.payaid.io',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
}

/**
 * GET /api/oauth/callback
 * OAuth2 Callback Endpoint for Analytics Module
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      const errorDescription = searchParams.get('error_description') || 'Authentication failed'
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(errorDescription)}`, request.url)
      )
    }

    if (!code) {
      const returnUrl = new URL('/api/oauth/callback', request.url).toString()
      return redirectToAuth(returnUrl)
    }

    const redirectUri = new URL('/api/oauth/callback', request.url).toString()
    let tokens: { access_token: string; refresh_token?: string }

    try {
      tokens = await exchangeCodeForTokens(code, redirectUri)
    } catch (error) {
      console.error('Token exchange error:', error)
      return NextResponse.redirect(
        new URL('/login?error=token_exchange_failed', request.url)
      )
    }

    const response = NextResponse.redirect(new URL('/', request.url))
    setTokenCookie(response, tokens.access_token)
    if (tokens.refresh_token) {
      setRefreshTokenCookie(response, tokens.refresh_token)
    }

    const returnTo = state ? decodeURIComponent(state) : '/'
    return NextResponse.redirect(new URL(returnTo, request.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/login?error=authentication_failed', request.url)
    )
  }
}

