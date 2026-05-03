/**
 * Outlook OAuth Callback Handler
 * 
 * Handles the OAuth callback from Microsoft after user authorization
 * Exchanges authorization code for access/refresh tokens
 * Stores tokens in EmailAccount providerCredentials for Microsoft Graph API access
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getEncryptionService } from '@/lib/security/encryption'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // Contains tenantId:userId
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Outlook OAuth error:', error)
      const errorDescription = searchParams.get('error_description') || 'Outlook authorization failed'
      return NextResponse.redirect(
        new URL(`/dashboard/email/accounts?error=${encodeURIComponent(errorDescription)}`, request.url)
      )
    }

    // Validate authorization code
    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/email/accounts?error=no_authorization_code', request.url)
      )
    }

    // Extract tenantId and userId from state (format: "tenantId:userId")
    if (!state) {
      return NextResponse.redirect(
        new URL('/dashboard/email/accounts?error=invalid_state', request.url)
      )
    }

    const [tenantId, userId] = state.split(':')
    if (!tenantId || !userId) {
      return NextResponse.redirect(
        new URL('/dashboard/email/accounts?error=invalid_state_format', request.url)
      )
    }

    // Exchange authorization code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/outlook/callback`
    
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.MICROSOFT_CLIENT_ID || '',
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL('/dashboard/email/accounts?error=token_exchange_failed', request.url)
      )
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokens

    if (!access_token) {
      return NextResponse.redirect(
        new URL('/dashboard/email/accounts?error=no_access_token', request.url)
      )
    }

    // Get user info from Microsoft Graph to get email address
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info')
      return NextResponse.redirect(
        new URL('/dashboard/email/accounts?error=user_info_failed', request.url)
      )
    }

    const userInfo = await userInfoResponse.json()
    const emailAddress = userInfo.mail || userInfo.userPrincipalName
    const displayName = userInfo.displayName || userInfo.mail || emailAddress

    if (!emailAddress) {
      return NextResponse.redirect(
        new URL('/dashboard/email/accounts?error=no_email_address', request.url)
      )
    }

    // Calculate token expiry
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString() // Default 1 hour

    // Encrypt tokens before storing
    const encryptionService = getEncryptionService()
    const encryptedAccessToken = encryptionService.encrypt(access_token)
    const encryptedRefreshToken = refresh_token ? encryptionService.encrypt(refresh_token) : null

    // Store tokens in providerCredentials JSON field (encrypted)
    const providerCredentials = {
      accessToken: encryptedAccessToken, // Encrypted
      refreshToken: encryptedRefreshToken, // Encrypted
      expiresAt,
      tokenType: 'Bearer',
      scope: tokens.scope || 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send',
    }

    // Store or update email account with Outlook tokens
    const emailAccount = await prisma.emailAccount.upsert({
      where: {
        tenantId_email: {
          tenantId,
          email: emailAddress,
        },
      },
      update: {
        provider: 'outlook',
        providerAccountId: userInfo.id || null,
        providerCredentials: providerCredentials as any,
        displayName: displayName || emailAddress,
        isActive: true,
        lastSyncAt: new Date(),
      },
      create: {
        tenantId,
        userId,
        email: emailAddress,
        displayName: displayName || emailAddress,
        provider: 'outlook',
        providerAccountId: userInfo.id || null,
        providerCredentials: providerCredentials as any,
        password: '$2a$10$PLACEHOLDER_FOR_OUTLOOK_OAUTH', // Placeholder - Outlook uses OAuth, not password
        isActive: true,
        lastSyncAt: new Date(),
      },
    })

    // Redirect back to email accounts page with success message
    return NextResponse.redirect(
      new URL(`/dashboard/email/accounts?success=outlook_connected&email=${encodeURIComponent(emailAddress)}`, request.url)
    )
  } catch (error) {
    console.error('Outlook callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/email/accounts?error=callback_failed', request.url)
    )
  }
}
