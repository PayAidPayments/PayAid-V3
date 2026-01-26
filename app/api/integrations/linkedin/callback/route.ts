import { NextRequest, NextResponse } from 'next/server'
import { LinkedInService } from '@/lib/integrations/social-media'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/integrations/linkedin/callback
 * LinkedIn OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`)
    }

    const [tenantId, userId] = state.split(':')

    const linkedInConfig = {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/linkedin/callback`,
    }

    const service = new LinkedInService(linkedInConfig)
    const accessToken = await service.getAccessToken(code)

    // Store access token (would be in integration settings)
    // await prisma.integrationSetting.create({...})

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?success=linkedin_connected`)
  } catch (error) {
    console.error('[LinkedIn Callback] Error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`)
  }
}
