import { NextRequest, NextResponse } from 'next/server'
import { getSessionToken } from '@/packages/auth-sdk/client'

/**
 * OAuth2 Authorization Endpoint
 * 
 * This endpoint initiates the OAuth2 flow for cross-module SSO.
 * When a user switches modules, they're redirected here to get an authorization code.
 */

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const token = await getSessionToken(request)
    if (!token) {
      // Redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Get OAuth parameters
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')
    const redirectUri = searchParams.get('redirect_uri')
    const state = searchParams.get('state')
    const responseType = searchParams.get('response_type') || 'code'

    // Validate parameters
    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate redirect URI (must be from allowed domains)
    const allowedDomains = [
      'localhost:3000',
      'payaid.in',
      'crm.payaid.in',
      'finance.payaid.in',
      'sales.payaid.in',
      'projects.payaid.in',
      'inventory.payaid.in',
    ]

    const redirectUrl = new URL(redirectUri)
    const isAllowed = allowedDomains.some(domain => 
      redirectUrl.hostname === domain || redirectUrl.hostname.endsWith(`.${domain}`)
    )

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Invalid redirect_uri' },
        { status: 400 }
      )
    }

    // Generate authorization code
    const authCode = generateAuthCode(token)

    // Store authorization code temporarily (in production, use Redis)
    // For now, we'll encode the token in the code (not secure, but works for development)
    // In production, store code -> token mapping in Redis with 5min TTL

    // Redirect back with authorization code
    const redirectUrlObj = new URL(redirectUri)
    redirectUrlObj.searchParams.set('code', authCode)
    if (state) {
      redirectUrlObj.searchParams.set('state', state)
    }

    return NextResponse.redirect(redirectUrlObj.toString())
  } catch (error: any) {
    console.error('[OAuth] Authorization error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate authorization code
 * In production, this should be a random code stored in Redis
 */
function generateAuthCode(token: string): string {
  // For development: encode token in code (not secure!)
  // In production: generate random code and store token in Redis
  const encoded = Buffer.from(token).toString('base64url')
  return `auth_${encoded}`
}
