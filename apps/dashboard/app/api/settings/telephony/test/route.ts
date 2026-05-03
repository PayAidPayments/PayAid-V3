import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { decrypt } from '@/lib/encryption'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { enforceIntegrationRateLimit } from '@/lib/integrations/security'

async function testTwilio(accountSid: string, authToken: string) {
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}.json`
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store' as any,
  })
  if (!res.ok) {
    throw new Error(`Twilio auth failed (HTTP ${res.status})`)
  }
}

async function testExotel(accountSid: string, authToken: string, apiBaseUrl?: string | null) {
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const base = (apiBaseUrl || 'https://api.exotel.com').replace(/\/+$/, '')
  const url = `${base}/v1/Accounts/${encodeURIComponent(accountSid)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store' as any,
  })
  if (!res.ok) {
    throw new Error(`Exotel auth failed (HTTP ${res.status})`)
  }
}

export async function POST(request: NextRequest) {
  const limited = enforceIntegrationRateLimit(request, {
    key: 'integration:telephony:test',
    limit: 8,
    windowMs: 60_000,
  })
  if (limited) return limited

  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'configure')

    const settings = await (prisma as any).tenantTelephonySettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    if (!settings || !settings.isConfigured || !settings.accountSid || !settings.authTokenEnc) {
      return NextResponse.json({ error: 'Telephony is not configured' }, { status: 400 })
    }

    const authToken = decrypt(settings.authTokenEnc)
    const provider = String(settings.provider || 'none')
    if (provider === 'twilio') {
      await testTwilio(settings.accountSid, authToken)
    } else if (provider === 'exotel') {
      await testExotel(settings.accountSid, authToken, settings.apiBaseUrl)
    } else {
      return NextResponse.json({ error: 'Select a supported provider first' }, { status: 400 })
    }

    await (prisma as any).tenantTelephonySettings.update({
      where: { tenantId: user.tenantId },
      data: {
        lastTestAt: new Date(),
        lastTestOk: true,
        lastTestError: null,
      },
    })

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_telephony',
      entityId: user.tenantId,
      action: 'telephony_test_passed',
      after: { provider, ok: true },
    })

    return NextResponse.json({ ok: true, provider })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) {
      return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    }

    const user = await authenticateRequest(request).catch(() => null)
    if (user?.tenantId) {
      await (prisma as any).tenantTelephonySettings
        .update({
          where: { tenantId: user.tenantId },
          data: {
            lastTestAt: new Date(),
            lastTestOk: false,
            lastTestError: error instanceof Error ? error.message : String(error),
          },
        })
        .catch(() => undefined)
      await writeIntegrationAudit({
        tenantId: user.tenantId,
        userId: user.userId,
        entityType: 'integration_telephony',
        entityId: user.tenantId,
        action: 'telephony_test_failed',
        after: { ok: false, error: error instanceof Error ? error.message : String(error) },
      })
    }

    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('ENCRYPTION_KEY')) {
      return NextResponse.json({ error: 'Server encryption is not configured. Set ENCRYPTION_KEY and redeploy.' }, { status: 500 })
    }
    if (message.includes('Invalid encrypted data format')) {
      return NextResponse.json({ error: 'Stored telephony secret format is invalid. Re-enter credentials and save again.' }, { status: 400 })
    }
    return NextResponse.json({ error: message || 'Failed to test telephony connection' }, { status: 502 })
  }
}

