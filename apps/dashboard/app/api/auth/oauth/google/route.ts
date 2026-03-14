import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { signToken } from '@/lib/auth/jwt'

// Google OAuth callback handler
// This would typically be set up with NextAuth.js, but for now we'll create a basic implementation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      )
    }

    // Exchange code for access token
    // In production, use Google OAuth2 client library
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.APP_URL}/api/auth/oauth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      return NextResponse.json(
        { error: 'Failed to get access token' },
        { status: 400 }
      )
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const googleUser = await userResponse.json()

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { tenant: true },
    })

    if (!user) {
      // Create new user with default tenant
      // In production, you'd want to handle tenant creation flow
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      )
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId || '',
      email: user.email,
      role: user.role,
    })

    // Redirect to dashboard with token
    const redirectUrl = new URL('/dashboard', process.env.APP_URL || 'http://localhost:3000')
    redirectUrl.searchParams.set('token', token)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('OAuth error:', error)
    return NextResponse.json(
      { error: 'OAuth authentication failed' },
      { status: 500 }
    )
  }
}

