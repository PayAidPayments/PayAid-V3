/**
 * Outlook OAuth Integration
 * GET /api/email/outlook/auth - Initiate Outlook OAuth flow
 * 
 * This endpoint initiates Microsoft Graph OAuth 2.0 flow for Outlook
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { decodeToken } from '@/lib/auth/jwt'

// GET /api/email/outlook/auth - Initiate Outlook OAuth
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    // Get current user ID from request
    const authHeader = request.headers.get('authorization')
    let userId = ''
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const payload = decodeToken(token)
        if (payload) userId = payload.userId
      } catch (e) {
        console.error('Error getting user from token:', e)
      }
    }

    // Pass tenantId:userId in state for callback
    const state = `${tenantId}:${userId}`

    const microsoftAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID || '',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/outlook/callback`,
      response_type: 'code',
      scope: [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/Mail.ReadWrite',
        'https://graph.microsoft.com/User.Read',
        'offline_access',
      ].join(' '),
      response_mode: 'query',
      state, // Pass tenantId:userId in state for callback
    })}`

    return NextResponse.json({
      authUrl: microsoftAuthUrl,
      message: 'Outlook OAuth integration - redirect user to authUrl to connect Outlook account',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Outlook auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Outlook OAuth' },
      { status: 500 }
    )
  }
}
