import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { decrypt } from '@/lib/encryption'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'
import { enforceIntegrationRateLimit } from '@/lib/integrations/security'

async function pingWaha(baseUrl: string, apiKey: string) {
  const url = baseUrl.replace(/\/+$/, '')
  const targets = [`${url}/api/sessions`, `${url}/api/health`, `${url}/health`]

  const headersVariants: Record<string, string>[] = [
    { Authorization: `Bearer ${apiKey}` },
    { 'X-Api-Key': apiKey },
    { 'x-api-key': apiKey },
  ]

  let lastErr: string | null = null

  for (const endpoint of targets) {
    for (const headers of headersVariants) {
      try {
        const res = await fetch(endpoint, { method: 'GET', headers, cache: 'no-store' as any })
        if (res.ok) return { ok: true, endpoint }
        lastErr = `HTTP ${res.status} from ${endpoint}`
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e)
      }
    }
  }

  return { ok: false, endpointTried: targets[0], error: lastErr || 'Unable to reach WAHA' }
}

export async function POST(request: NextRequest) {
  const limited = enforceIntegrationRateLimit(request, {
    key: 'integration:waha:test',
    limit: 8,
    windowMs: 60_000,
  })
  if (limited) return limited

  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'configure')

    const settings = await (prisma as any).tenantWahaSettings.findUnique({
      where: { tenantId: user.tenantId },
    })

    if (!settings?.isConfigured || !settings.baseUrl || !settings.apiKeyEnc) {
      return NextResponse.json({ error: 'WAHA is not configured' }, { status: 400 })
    }

    const apiKey = decrypt(settings.apiKeyEnc)
    const result = await pingWaha(settings.baseUrl, apiKey)

    await (prisma as any).tenantWahaSettings.update({
      where: { tenantId: user.tenantId },
      data: {
        lastTestAt: new Date(),
        lastTestOk: result.ok,
        lastTestError: result.ok ? null : result.error || 'Test failed',
      },
    })

    if (!result.ok) {
      await writeIntegrationAudit({
        tenantId: user.tenantId,
        userId: user.userId,
        entityType: 'integration_waha',
        entityId: user.tenantId,
        action: 'waha_test_failed',
        after: { ok: false, error: result.error || 'Test failed' },
      })
      return NextResponse.json({ error: result.error || 'WAHA connection failed' }, { status: 502 })
    }

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_waha',
      entityId: user.tenantId,
      action: 'waha_test_passed',
      after: { ok: true, endpoint: (result as any).endpoint || null },
    })

    return NextResponse.json({ ok: true, endpoint: (result as any).endpoint })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('ENCRYPTION_KEY')) {
      return NextResponse.json({ error: 'Server encryption is not configured. Set ENCRYPTION_KEY and redeploy.' }, { status: 500 })
    }
    if (message.includes('Invalid encrypted data format')) {
      return NextResponse.json({ error: 'Stored WAHA secret format is invalid. Re-enter API key and save again.' }, { status: 400 })
    }
    console.error('WAHA test error:', error)
    return NextResponse.json({ error: 'Failed to test WAHA connection' }, { status: 500 })
  }
}

