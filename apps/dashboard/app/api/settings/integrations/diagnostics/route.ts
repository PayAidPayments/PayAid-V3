import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'

type CheckStatus = 'ok' | 'warning'

type DiagnosticCheck = {
  key: string
  label: string
  status: CheckStatus
  detail: string
}

type DiagnosticModule = {
  id: 'email' | 'whatsapp' | 'telephony' | 'social'
  title: string
  checks: DiagnosticCheck[]
  nextActions: string[]
}

function moduleHealth(checks: DiagnosticCheck[]): CheckStatus {
  return checks.some((c) => c.status === 'warning') ? 'warning' : 'ok'
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'view')

    const tenantId = user.tenantId
    const staleWebhookThreshold = new Date(Date.now() - 6 * 60 * 60 * 1000)

    const [smtp, waha, telephony, emailOauth, socialOauth] = await Promise.all([
      (prisma as any).tenantSmtpSettings.findUnique({ where: { tenantId } }),
      (prisma as any).tenantWahaSettings.findUnique({ where: { tenantId } }),
      (prisma as any).tenantTelephonySettings.findUnique({ where: { tenantId } }),
      prisma.oAuthIntegration.findMany({
        where: { tenantId, provider: { in: ['gmail', 'outlook'] }, isActive: true },
        select: { provider: true, expiresAt: true, providerEmail: true, providerName: true },
      }),
      prisma.oAuthIntegration.findMany({
        where: { tenantId, provider: { in: ['linkedin', 'facebook', 'instagram', 'twitter'] }, isActive: true },
        select: { provider: true, expiresAt: true, providerEmail: true, providerName: true },
      }),
    ])

    const now = Date.now()
    const emailExpired = emailOauth.filter((a) => a.expiresAt && a.expiresAt.getTime() <= now).length
    const socialExpired = socialOauth.filter((a) => a.expiresAt && a.expiresAt.getTime() <= now).length

    const modules: DiagnosticModule[] = [
      {
        id: 'email',
        title: 'Email (SMTP + OAuth)',
        checks: [
          {
            key: 'smtp_config',
            label: 'SMTP configuration',
            status: smtp?.isConfigured ? 'ok' : 'warning',
            detail: smtp?.isConfigured ? 'SMTP is configured.' : 'SMTP is not configured.',
          },
          {
            key: 'smtp_test',
            label: 'Latest SMTP test',
            status: smtp?.lastTestOk === false ? 'warning' : 'ok',
            detail:
              smtp?.lastTestOk === false
                ? smtp?.lastTestError || 'Latest SMTP test failed.'
                : smtp?.lastTestAt
                ? `Last test passed/unknown at ${new Date(smtp.lastTestAt).toISOString()}.`
                : 'No SMTP test recorded yet.',
          },
          {
            key: 'oauth_expiry',
            label: 'OAuth token expiry',
            status: emailExpired > 0 ? 'warning' : 'ok',
            detail: emailExpired > 0 ? `${emailExpired} email OAuth token(s) expired.` : 'No expired email OAuth tokens.',
          },
        ],
        nextActions: [
          'Open Email settings and run Send test.',
          'Reconnect expired OAuth providers.',
        ],
      },
      {
        id: 'whatsapp',
        title: 'WhatsApp (WAHA)',
        checks: [
          {
            key: 'waha_config',
            label: 'WAHA configuration',
            status: waha?.isConfigured ? 'ok' : 'warning',
            detail: waha?.isConfigured ? 'WAHA is configured.' : 'WAHA is not configured.',
          },
          {
            key: 'waha_test',
            label: 'Latest WAHA test',
            status: waha?.lastTestOk === false ? 'warning' : 'ok',
            detail:
              waha?.lastTestOk === false
                ? waha?.lastTestError || 'Latest WAHA test failed.'
                : waha?.lastTestAt
                ? `Last WAHA test at ${new Date(waha.lastTestAt).toISOString()}.`
                : 'No WAHA test recorded yet.',
          },
        ],
        nextActions: ['Open WhatsApp settings and run Test connection.'],
      },
      {
        id: 'telephony',
        title: 'Telephony',
        checks: [
          {
            key: 'telephony_config',
            label: 'Provider configuration',
            status: telephony?.isConfigured ? 'ok' : 'warning',
            detail: telephony?.isConfigured
              ? `Provider: ${telephony?.provider || 'configured'}.`
              : 'Telephony provider is not configured.',
          },
          {
            key: 'telephony_webhook',
            label: 'Webhook freshness',
            status:
              telephony?.isConfigured &&
              telephony?.provider !== 'none' &&
              (!telephony?.lastWebhookAt || new Date(telephony.lastWebhookAt).getTime() < staleWebhookThreshold.getTime())
                ? 'warning'
                : 'ok',
            detail:
              telephony?.lastWebhookAt
                ? `Last webhook at ${new Date(telephony.lastWebhookAt).toISOString()}.`
                : 'No webhook received yet.',
          },
        ],
        nextActions: [
          'Open Telephony settings and run Test call.',
          'Validate webhook URL/provider credentials.',
        ],
      },
      {
        id: 'social',
        title: 'Social',
        checks: [
          {
            key: 'social_connected',
            label: 'Connected providers',
            status: socialOauth.length > 0 ? 'ok' : 'warning',
            detail: socialOauth.length > 0 ? `${socialOauth.length} social OAuth account(s) connected.` : 'No social providers connected.',
          },
          {
            key: 'social_oauth_expiry',
            label: 'Token expiry',
            status: socialExpired > 0 ? 'warning' : 'ok',
            detail: socialExpired > 0 ? `${socialExpired} social OAuth token(s) expired.` : 'No expired social OAuth tokens.',
          },
        ],
        nextActions: [
          'Open Social settings and reconnect expired providers.',
          'Run Social connection test.',
        ],
      },
    ]

    return NextResponse.json({
      modules: modules.map((m) => ({ ...m, status: moduleHealth(m.checks) })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    console.error('Integration diagnostics error:', error)
    return NextResponse.json({ error: 'Failed to load integration diagnostics' }, { status: 500 })
  }
}

