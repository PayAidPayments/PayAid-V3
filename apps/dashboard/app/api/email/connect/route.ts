/**
 * Unified Email Connection API
 * POST /api/email/connect - Initiate OAuth flow for Gmail or Outlook
 * 
 * This endpoint provides a unified interface for connecting email accounts
 * Supports: Gmail (OAuth 2.0) and Outlook (Microsoft Graph OAuth 2.0)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { decodeToken } from '@/lib/auth/jwt'
import { z } from 'zod'

const connectEmailSchema = z.object({
  provider: z.enum(['gmail', 'outlook']),
})

// POST /api/email/connect - Initiate OAuth flow
export async function POST(request: NextRequest) {
  try {
    // Check CRM/Communication module license
    const { tenantId } = await requireModuleAccess(request, 'communication')

    // Get current user ID from request
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

    // If no userId from token, try to get from request body
    const body = await request.json()
    const validated = connectEmailSchema.parse(body)
    
    if (!userId && body.userId) {
      userId = body.userId
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Pass tenantId:userId in state for callback
    const state = `${tenantId}:${userId}`

    let authUrl = ''

    if (validated.provider === 'gmail') {
      // Gmail OAuth 2.0
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/gmail/callback`,
        response_type: 'code',
        scope: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
        ].join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state,
      })}`
    } else if (validated.provider === 'outlook') {
      // Outlook/Microsoft Graph OAuth 2.0
      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({
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
        state,
      })}`
    } else {
      return NextResponse.json(
        { error: 'Invalid provider. Supported: gmail, outlook' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      authUrl,
      provider: validated.provider,
      message: `Redirect user to authUrl to connect ${validated.provider} account`,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Email connect error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate email OAuth' },
      { status: 500 }
    )
  }
}
