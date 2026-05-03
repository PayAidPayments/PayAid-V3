import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'

type AlertSeverity = 'high' | 'medium' | 'low'
type AlertCode =
  | 'SMTP_TEST_FAILED'
  | 'WAHA_TEST_FAILED'
  | 'TELEPHONY_TEST_FAILED'
  | 'WEBHOOK_STALE'
  | 'OAUTH_TOKEN_EXPIRED'
  | 'OAUTH_TOKEN_EXPIRING'
  | 'INTEGRATION_ERROR_BURST'

type IntegrationAlert = {
  code: AlertCode
  severity: AlertSeverity
  title: string
  message: string
  source: string
  occurredAt: string
}

function pushAlert(target: IntegrationAlert[], alert: IntegrationAlert) {
  target.push(alert)
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'view')

    const tenantId = user.tenantId
    const now = Date.now()
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000)
    const staleWebhookThreshold = new Date(now - 6 * 60 * 60 * 1000)
    const upcomingExpiryThreshold = new Date(now + 24 * 60 * 60 * 1000)

    const [smtp, waha, telephony, emailOauth, socialOauth, integrationErrors] = await Promise.all([
      (prisma as any).tenantSmtpSettings.findUnique({ where: { tenantId } }),
      (prisma as any).tenantWahaSettings.findUnique({ where: { tenantId } }),
      (prisma as any).tenantTelephonySettings.findUnique({ where: { tenantId } }),
      prisma.oAuthIntegration.findMany({
        where: { tenantId, isActive: true, provider: { in: ['gmail', 'outlook'] } },
        select: { provider: true, expiresAt: true, updatedAt: true, providerEmail: true, providerName: true },
      }),
      prisma.oAuthIntegration.findMany({
        where: { tenantId, isActive: true, provider: { in: ['linkedin', 'facebook', 'instagram', 'twitter'] } },
        select: { provider: true, expiresAt: true, updatedAt: true, providerEmail: true, providerName: true },
      }),
      prisma.auditLog.findMany({
        where: { tenantId, entityType: 'integration_error', timestamp: { gte: oneDayAgo } },
        orderBy: { timestamp: 'desc' },
        take: 50,
        select: { entityId: true, timestamp: true },
      }),
    ])

    const alerts: IntegrationAlert[] = []

    if (smtp?.isConfigured && smtp?.lastTestOk === false) {
      pushAlert(alerts, {
        code: 'SMTP_TEST_FAILED',
        severity: 'medium',
        title: 'SMTP test is failing',
        message: smtp?.lastTestError || 'Latest SMTP test failed. Revalidate credentials and sender policy.',
        source: 'smtp',
        occurredAt: (smtp?.lastTestAt || smtp?.updatedAt || new Date()).toISOString(),
      })
    }

    if (waha?.isConfigured && waha?.lastTestOk === false) {
      pushAlert(alerts, {
        code: 'WAHA_TEST_FAILED',
        severity: 'medium',
        title: 'WAHA connection test failed',
        message: waha?.lastTestError || 'Latest WAHA test failed. Verify base URL/API key and instance mapping.',
        source: 'waha',
        occurredAt: (waha?.lastTestAt || waha?.updatedAt || new Date()).toISOString(),
      })
    }

    if (telephony?.isConfigured && telephony?.lastTestOk === false) {
      pushAlert(alerts, {
        code: 'TELEPHONY_TEST_FAILED',
        severity: 'medium',
        title: 'Telephony test failed',
        message: telephony?.lastTestError || 'Latest telephony test failed. Verify provider credentials.',
        source: 'telephony',
        occurredAt: (telephony?.lastTestAt || telephony?.updatedAt || new Date()).toISOString(),
      })
    }

    if (telephony?.isConfigured && telephony?.provider !== 'none') {
      const lastWebhookAt = telephony?.lastWebhookAt ? new Date(telephony.lastWebhookAt) : null
      if (!lastWebhookAt || lastWebhookAt.getTime() < staleWebhookThreshold.getTime()) {
        pushAlert(alerts, {
          code: 'WEBHOOK_STALE',
          severity: 'high',
          title: 'Telephony webhook is stale',
          message: lastWebhookAt
            ? `No webhook received in the last 6 hours (last: ${lastWebhookAt.toISOString()}).`
            : 'No webhook received yet. Check webhook URL/signature setup.',
          source: 'telephony_webhook',
          occurredAt: (lastWebhookAt || telephony?.updatedAt || new Date()).toISOString(),
        })
      }
    }

    for (const acct of emailOauth) {
      if (!acct.expiresAt) continue
      const expiry = acct.expiresAt.getTime()
      const identity = acct.providerEmail || acct.providerName || acct.provider
      if (expiry <= now) {
        pushAlert(alerts, {
          code: 'OAUTH_TOKEN_EXPIRED',
          severity: 'high',
          title: `${acct.provider} token expired`,
          message: `Reconnect ${acct.provider} account ${identity}`.trim(),
          source: `oauth_${acct.provider}`,
          occurredAt: acct.expiresAt.toISOString(),
        })
      } else if (expiry <= upcomingExpiryThreshold.getTime()) {
        pushAlert(alerts, {
          code: 'OAUTH_TOKEN_EXPIRING',
          severity: 'low',
          title: `${acct.provider} token expiring soon`,
          message: `Token for ${identity} expires within 24 hours.`,
          source: `oauth_${acct.provider}`,
          occurredAt: acct.expiresAt.toISOString(),
        })
      }
    }

    for (const acct of socialOauth) {
      if (!acct.expiresAt) continue
      const expiry = acct.expiresAt.getTime()
      const identity = acct.providerEmail || acct.providerName || acct.provider
      if (expiry <= now) {
        pushAlert(alerts, {
          code: 'OAUTH_TOKEN_EXPIRED',
          severity: 'high',
          title: `${acct.provider} token expired`,
          message: `Reconnect ${acct.provider} account ${identity}.`,
          source: `oauth_${acct.provider}`,
          occurredAt: acct.expiresAt.toISOString(),
        })
      } else if (expiry <= upcomingExpiryThreshold.getTime()) {
        pushAlert(alerts, {
          code: 'OAUTH_TOKEN_EXPIRING',
          severity: 'low',
          title: `${acct.provider} token expiring soon`,
          message: `Token for ${identity} expires within 24 hours.`,
          source: `oauth_${acct.provider}`,
          occurredAt: acct.expiresAt.toISOString(),
        })
      }
    }

    if (integrationErrors.length >= 3) {
      pushAlert(alerts, {
        code: 'INTEGRATION_ERROR_BURST',
        severity: 'high',
        title: 'Integration error burst detected',
        message: `${integrationErrors.length} integration errors captured in the last 24 hours.`,
        source: 'integration_error',
        occurredAt: integrationErrors[0].timestamp.toISOString(),
      })
    }

    const sorted = alerts.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())

    return NextResponse.json({
      alerts: sorted,
      summary: {
        total: sorted.length,
        high: sorted.filter((a) => a.severity === 'high').length,
        medium: sorted.filter((a) => a.severity === 'medium').length,
        low: sorted.filter((a) => a.severity === 'low').length,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    console.error('Integration alerts error:', error)
    return NextResponse.json({ error: 'Failed to load integration alerts' }, { status: 500 })
  }
}

