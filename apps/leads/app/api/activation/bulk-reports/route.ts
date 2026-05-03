import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { randomUUID } from 'crypto'

interface BulkReportInput {
  tenantId: string
  action: string
  total: number
  processed: number
  succeeded: number
  failed: number
  failures: string[]
  generatedAt?: string
}

function toMarkdown(reportId: string, input: BulkReportInput) {
  const timestamp = input.generatedAt ?? new Date().toISOString()
  const failures = input.failures.length
    ? input.failures.map((failure) => `- ${failure}`).join('\n')
    : '- None'

  return [
    '# Lead Activation Bulk Report',
    '',
    `- Report ID: ${reportId}`,
    `- Generated At: ${timestamp}`,
    `- Action: ${input.action}`,
    `- Tenant: ${input.tenantId}`,
    '',
    '## Summary',
    '',
    `- Total: ${input.total}`,
    `- Processed: ${input.processed}`,
    `- Succeeded: ${input.succeeded}`,
    `- Failed: ${input.failed}`,
    '',
    '## Failures',
    '',
    failures,
    '',
  ].join('\n')
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<BulkReportInput>
  const tenantId = body.tenantId?.trim()
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const report: BulkReportInput = {
    tenantId,
    action: String(body.action ?? 'unknown'),
    total: Number(body.total ?? 0),
    processed: Number(body.processed ?? 0),
    succeeded: Number(body.succeeded ?? 0),
    failed: Number(body.failed ?? 0),
    failures: Array.isArray(body.failures) ? body.failures.map(String) : [],
    generatedAt: body.generatedAt ?? new Date().toISOString(),
  }

  const reportId = randomUUID()
  const markdown = toMarkdown(reportId, report)

  await prisma.leadAuditEvent.create({
    data: {
      tenantId,
      entityType: 'lead_activation_set_bulk_report',
      entityId: reportId,
      action: 'exported',
      metadata: {
        ...report,
        markdown,
      },
    },
  })

  return NextResponse.json({
    reportId,
    json: report,
    markdown,
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tenantId = searchParams.get('tenantId')
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')))
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const items = await prisma.leadAuditEvent.findMany({
    where: {
      tenantId,
      entityType: 'lead_activation_set_bulk_report',
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      entityId: true,
      createdAt: true,
      metadata: true,
    },
  })

  const history = items.map((item) => {
    const metadata = (item.metadata ?? {}) as {
      action?: string
      total?: number
      processed?: number
      succeeded?: number
      failed?: number
    }
    return {
      id: item.id,
      reportId: item.entityId,
      createdAt: item.createdAt,
      action: metadata.action ?? 'unknown',
      total: Number(metadata.total ?? 0),
      processed: Number(metadata.processed ?? 0),
      succeeded: Number(metadata.succeeded ?? 0),
      failed: Number(metadata.failed ?? 0),
    }
  })

  return NextResponse.json({ items: history })
}
