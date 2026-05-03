import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { decrypt, encrypt } from '@/lib/encryption'
import { z } from 'zod'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import {
  getSocialProviderAliases,
  normalizeSocialProviderAlias,
  SOCIAL_SETTINGS_PROVIDER_IDS_WITH_ALIASES,
} from '@/lib/integrations/social-provider-aliases'

const bodySchema = z.object({
  provider: z.enum(SOCIAL_SETTINGS_PROVIDER_IDS_WITH_ALIASES),
})

async function refreshLinkedIn(integration: any) {
  const refreshTokenEnc = integration?.refreshToken
  if (!refreshTokenEnc) {
    throw new Error('No refresh token available. Reconnect LinkedIn with offline access.')
  }

  const refreshToken = decrypt(refreshTokenEnc)
  const clientId = process.env.LINKEDIN_CLIENT_ID || ''
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET || ''
  if (!clientId || !clientSecret) {
    throw new Error('LinkedIn OAuth is not configured on the server.')
  }

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  const json: any = await response.json().catch(() => ({}))
  if (!response.ok || !json?.access_token) {
    throw new Error(json?.error_description || json?.error || `LinkedIn refresh failed (HTTP ${response.status})`)
  }

  const accessTokenEnc = encrypt(json.access_token)
  const nextRefreshTokenEnc = json.refresh_token ? encrypt(json.refresh_token) : integration.refreshToken
  const expiresIn = Number(json.expires_in || 0)
  const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null

  return {
    accessToken: accessTokenEnc,
    refreshToken: nextRefreshTokenEnc,
    expiresAt,
    tokenType: 'Bearer',
    scope: json.scope || integration.scope || null,
    lastUsedAt: new Date(),
    isActive: true,
  }
}

async function refreshMeta(integration: any, provider: 'facebook' | 'instagram') {
  const appId = process.env.META_APP_ID || ''
  const appSecret = process.env.META_APP_SECRET || ''
  if (!appId || !appSecret) {
    throw new Error(`Meta OAuth is not configured for ${provider}. Set META_APP_ID and META_APP_SECRET.`)
  }

  const accessToken = decrypt(integration.accessToken)
  const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('fb_exchange_token', accessToken)
  const response = await fetch(url.toString(), { method: 'GET' })
  const json: any = await response.json().catch(() => ({}))
  if (!response.ok || !json?.access_token) {
    throw new Error(json?.error?.message || `Meta token refresh failed (HTTP ${response.status})`)
  }

  const expiresIn = Number(json.expires_in || 0)
  const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null
  return {
    accessToken: encrypt(json.access_token),
    expiresAt,
    tokenType: 'Bearer',
    lastUsedAt: new Date(),
    isActive: true,
  }
}

async function refreshYouTube(integration: any) {
  const refreshTokenEnc = integration?.refreshToken
  if (!refreshTokenEnc) {
    throw new Error('No refresh token available. Reconnect YouTube with offline access.')
  }
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
  if (!clientId || !clientSecret) {
    throw new Error('YouTube OAuth is not configured on the server.')
  }

  const refreshToken = decrypt(refreshTokenEnc)
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  const json: any = await response.json().catch(() => ({}))
  if (!response.ok || !json?.access_token) {
    throw new Error(json?.error_description || json?.error || `YouTube refresh failed (HTTP ${response.status})`)
  }
  const expiresIn = Number(json.expires_in || 0)
  const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null
  return {
    accessToken: encrypt(json.access_token),
    refreshToken: integration.refreshToken,
    expiresAt,
    tokenType: json.token_type || 'Bearer',
    scope: json.scope || integration.scope || null,
    lastUsedAt: new Date(),
    isActive: true,
  }
}

async function refreshTwitter(integration: any) {
  const refreshTokenEnc = integration?.refreshToken
  if (!refreshTokenEnc) {
    throw new Error('No refresh token available. Reconnect X/Twitter with offline access.')
  }

  const clientId = process.env.TWITTER_CLIENT_ID || process.env.X_CLIENT_ID || ''
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || process.env.X_CLIENT_SECRET || ''
  if (!clientId || !clientSecret) {
    throw new Error('X OAuth is not configured on the server.')
  }

  const refreshToken = decrypt(refreshTokenEnc)
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  })
  const json: any = await response.json().catch(() => ({}))
  if (!response.ok || !json?.access_token) {
    throw new Error(json?.error_description || json?.error || `X refresh failed (HTTP ${response.status})`)
  }

  const expiresIn = Number(json.expires_in || 0)
  const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null
  return {
    accessToken: encrypt(json.access_token),
    refreshToken: json.refresh_token ? encrypt(json.refresh_token) : integration.refreshToken,
    expiresAt,
    tokenType: json.token_type || 'Bearer',
    scope: json.scope || integration.scope || null,
    lastUsedAt: new Date(),
    isActive: true,
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'configure')

    const { provider } = bodySchema.parse(await request.json())
    const providerAliases = getSocialProviderAliases(provider)
    const providerKey = normalizeSocialProviderAlias(provider)
    const integration = await prisma.oAuthIntegration.findFirst({
      where: { tenantId: user.tenantId, provider: { in: providerAliases }, isActive: true },
      orderBy: { updatedAt: 'desc' },
    })
    if (!integration) {
      return NextResponse.json({ error: `${providerKey} is not connected` }, { status: 400 })
    }

    let updateData: any
    if (providerKey === 'linkedin') updateData = await refreshLinkedIn(integration)
    else if (providerKey === 'facebook' || providerKey === 'instagram')
      updateData = await refreshMeta(integration, providerKey)
    else if (providerKey === 'youtube') updateData = await refreshYouTube(integration)
    else if (providerKey === 'twitter') updateData = await refreshTwitter(integration)
    else
      return NextResponse.json(
        {
          error: `Refresh flow for ${providerKey} is not implemented yet.`,
          guidance:
            providerKey === 'youtube'
              ? 'Reconnect YouTube from Social Settings to issue a fresh token with youtube.upload scope.'
              : 'Reconnect this provider from Social Settings to refresh credentials.',
          code: 'SOCIAL_REFRESH_NOT_IMPLEMENTED',
        },
        { status: 501 }
      )

    const updated = await prisma.oAuthIntegration.update({
      where: { id: integration.id },
      data: updateData,
      select: { provider: true, expiresAt: true, updatedAt: true },
    })

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_social',
      entityId: `${user.tenantId}:${providerKey}`,
      action: 'social_token_refreshed',
      after: {
        provider: providerKey,
        expiresAt: updated.expiresAt?.toISOString?.() ?? null,
      },
    })

    return NextResponse.json({
      ok: true,
      provider: providerKey,
      expiresAt: updated.expiresAt?.toISOString?.() ?? null,
      updatedAt: updated.updatedAt?.toISOString?.() ?? null,
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('ENCRYPTION_KEY')) {
      return NextResponse.json({ error: 'Server encryption is not configured. Set ENCRYPTION_KEY and redeploy.' }, { status: 500 })
    }
    if (message.includes('Invalid encrypted data format')) {
      return NextResponse.json({ error: 'Stored OAuth token format is invalid. Reconnect the provider.' }, { status: 400 })
    }
    return NextResponse.json({ error: message || 'Failed to refresh social token' }, { status: 500 })
  }
}

