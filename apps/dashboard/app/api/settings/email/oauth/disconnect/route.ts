import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { assertIntegrationPermission, toPermissionDeniedResponse } from '@/lib/integrations/permissions'
import { writeIntegrationAudit } from '@/lib/integrations/audit'

const bodySchema = z.object({
  provider: z.enum(['gmail', 'outlook']),
})

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await assertIntegrationPermission(request, 'configure')

    const { provider } = bodySchema.parse(await request.json())

    await prisma.emailAccount.updateMany({
      where: { tenantId: user.tenantId, provider },
      data: {
        isActive: false,
        providerCredentials: null,
        lastSyncAt: new Date(),
      },
    })

    await writeIntegrationAudit({
      tenantId: user.tenantId,
      userId: user.userId,
      entityType: 'integration_email_oauth',
      entityId: `${user.tenantId}:${provider}`,
      action: 'email_oauth_disconnected',
      after: { provider, isActive: false },
    })

    return NextResponse.json({ ok: true, provider })
  } catch (error) {
    const permissionDenied = toPermissionDeniedResponse(error)
    if (permissionDenied) return NextResponse.json(permissionDenied.json, { status: permissionDenied.status })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Email OAuth disconnect error:', error)
    return NextResponse.json({ error: 'Failed to disconnect provider' }, { status: 500 })
  }
}

