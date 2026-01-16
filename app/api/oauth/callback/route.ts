import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * OAuth2 Callback Endpoint
 * 
 * Handles OAuth2 callback from authorization server
 * Exchanges authorization code for tokens and sets cookies
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'OAuth authorization failed'
      return NextResponse.redirect(
        `/login?error=${encodeURIComponent(errorDescription)}`
      )
    }

    // Validate authorization code
    if (!code) {
      return NextResponse.redirect(
        '/login?error=' + encodeURIComponent('Missing authorization code')
      )
    }

    // Exchange code for tokens
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const tokenResponse = await fetch(`${apiUrl}/api/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${apiUrl}/api/oauth/callback`,
        client_id: 'payaid-client',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      return NextResponse.redirect(
        `/login?error=${encodeURIComponent(errorData.error_description || 'Token exchange failed')}`
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token } = tokenData

    // Set cookies with domain-wide scope for cross-subdomain SSO
    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === 'production'
    const domain = isProduction ? '.payaid.in' : undefined

    // Set access token cookie
    cookieStore.set('token', access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      domain,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Set refresh token cookie (if provided)
    if (refresh_token) {
      cookieStore.set('refresh_token', refresh_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        domain,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    // Redirect to home or state-specified URL
    const redirectUrl = state ? decodeURIComponent(state) : '/dashboard'
    return NextResponse.redirect(redirectUrl)
  } catch (error: any) {
    console.error('[OAuth] Callback error:', error)
    return NextResponse.redirect(
      `/login?error=${encodeURIComponent('OAuth callback failed')}`
    )
  }
}

