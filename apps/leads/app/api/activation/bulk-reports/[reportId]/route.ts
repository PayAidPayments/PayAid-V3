import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function GET(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const { reportId } = await params
  const item = await prisma.leadAuditEvent.findFirst({
    where: {
      tenantId,
      entityType: 'lead_activation_set_bulk_report',
      entityId: reportId,
    },
    select: {
      entityId: true,
      metadata: true,
      createdAt: true,
    },
  })

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const metadata = (item.metadata ?? {}) as {
    markdown?: string
    action?: string
    total?: number
    processed?: number
    succeeded?: number
    failed?: number
    failures?: string[]
    generatedAt?: string
    tenantId?: string
  }

  return NextResponse.json({
    reportId: item.entityId,
    json: {
      tenantId: metadata.tenantId ?? tenantId,
      action: metadata.action ?? 'unknown',
      total: Number(metadata.total ?? 0),
      processed: Number(metadata.processed ?? 0),
      succeeded: Number(metadata.succeeded ?? 0),
      failed: Number(metadata.failed ?? 0),
      failures: Array.isArray(metadata.failures) ? metadata.failures : [],
      generatedAt: metadata.generatedAt ?? item.createdAt.toISOString(),
    },
    markdown: metadata.markdown ?? '',
    createdAt: item.createdAt,
  })
}
