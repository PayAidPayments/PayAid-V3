import { NextRequest, NextResponse } from 'next/server'

// Generate Google OAuth authorization URL
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.APP_URL}/api/auth/oauth/google/callback`
  const scope = 'openid email profile'
  const state = request.nextUrl.searchParams.get('state') || 'default'

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId || '')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scope)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')

  return NextResponse.json({ authUrl: authUrl.toString() })
}

