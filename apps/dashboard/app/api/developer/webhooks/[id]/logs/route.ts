import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** GET /api/developer/webhooks/[id]/logs - Get webhook delivery logs */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const webhookId = params.id

    // Verify webhook belongs to tenant
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        tenantId,
      },
    })

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      )
    }

    // Get delivery logs (WebhookDeliveryLog model may not exist yet)
    // For now, return empty array - logs can be tracked via webhook execution history
    // TODO: Implement WebhookDeliveryLog model or track via workflow executions
    const logs: any[] = []

    return NextResponse.json(logs)
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get logs' },
      { status: 500 }
    )
  }
}
