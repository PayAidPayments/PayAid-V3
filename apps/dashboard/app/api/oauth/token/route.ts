import { NextRequest, NextResponse } from 'next/server'
import { getSessionToken } from '@/packages/auth-sdk/client'

/**
 * OAuth2 Token Endpoint
 * 
 * Exchanges authorization code for access token
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const grantType = body.get('grant_type')
    const code = body.get('code')
    const redirectUri = body.get('redirect_uri')
    const clientId = body.get('client_id')
    const clientSecret = body.get('client_secret')

    // Validate grant type
    if (grantType !== 'authorization_code') {
      return NextResponse.json(
        { error: 'unsupported_grant_type', error_description: 'Only authorization_code is supported' },
        { status: 400 }
      )
    }

    // Validate parameters
    if (!code || !redirectUri || !clientId) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify client secret (if provided)
    const expectedSecret = process.env.OAUTH_CLIENT_SECRET || 'default-secret'
    if (clientSecret && clientSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client credentials' },
        { status: 401 }
      )
    }

    // Decode authorization code to get token
    // In production, look up code in Redis to get token
    let token: string | null = null
    if (code.toString().startsWith('auth_')) {
      const encoded = code.toString().substring(5)
      try {
        token = Buffer.from(encoded, 'base64url').toString()
      } catch {
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'Invalid authorization code' },
          { status: 400 }
        )
      }
    } else {
      // In production, lookup code in Redis
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid authorization code format' },
        { status: 400 }
      )
    }

    // Verify token is still valid
    if (!token) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid or expired authorization code' },
        { status: 400 }
      )
    }

    // Generate access token (for now, use the same token)
    // In production, generate a new JWT with appropriate scopes
    const accessToken = token

    // Optionally generate refresh token
    const refreshToken = generateRefreshToken(token)

    // Return tokens
    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
      refresh_token: refreshToken,
      scope: 'read write',
    })
  } catch (error: any) {
    console.error('[OAuth] Token exchange error:', error)
    return NextResponse.json(
      { error: 'server_error', error_description: error.message },
      { status: 500 }
    )
  }
}

/**
 * Generate refresh token
 */
function generateRefreshToken(originalToken: string): string {
  // In production, generate a secure random token and store mapping in Redis
  const timestamp = Date.now()
  return `refresh_${Buffer.from(`${originalToken}_${timestamp}`).toString('base64url')}`
}
