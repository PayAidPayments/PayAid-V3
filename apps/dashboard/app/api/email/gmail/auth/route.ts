import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { decodeToken } from '@/lib/auth/jwt'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { enforceIntegrationRateLimit } from '@/lib/integrations/security'

/**
 * Gmail OAuth Integration
 * 
 * This endpoint initiates Gmail OAuth flow
 * Full implementation requires:
 * - Google OAuth 2.0 credentials setup
 * - OAuth callback handler
 * - Token storage and refresh
 * - Gmail API client initialization
 */

// GET /api/email/gmail/auth - Initiate Gmail OAuth
export async function GET(request: NextRequest) {
  const limited = enforceIntegrationRateLimit(request, {
    key: 'integration:oauth:gmail:connect',
    limit: 8,
    windowMs: 60_000,
  })
  if (limited) return limited

  try {
    await assertIntegrationPermission(request, 'configure')
    const { tenantId } = await requireModuleAccess(request, 'communication')

    // Get current user ID from request (needed for EmailAccount creation)
    const authHeader = request.headers.get('authorization')
    let userId = ''
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const payload = decodeToken(token)
        if (payload && payload.userId) {
          userId = payload.userId
        }
      } catch (e) {
        console.error('Error getting user from token:', e)
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Pass tenantId:userId in state for callback
    const state = `${tenantId}:${userId}`

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/gmail/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
      access_type: 'offline',
      prompt: 'consent',
      state, // Pass tenantId:userId in state for callback
    })}`

    await writeIntegrationAudit({
      tenantId,
      userId,
      entityType: 'integration_email_oauth',
      entityId: `${tenantId}:gmail`,
      action: 'gmail_oauth_connect_initiated',
      after: { provider: 'gmail' },
    })

    return NextResponse.json({
      authUrl: googleAuthUrl,
      message: 'Gmail OAuth integration - redirect user to authUrl to connect Gmail account',
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Gmail auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Gmail OAuth' },
      { status: 500 }
    )
  }
}

