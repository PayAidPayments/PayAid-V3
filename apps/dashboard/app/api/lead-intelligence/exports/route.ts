import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import {
  buildAccountDiscoveryWhere,
  normalizeDiscoveryAccountRow,
  parseDiscoveryQuery,
} from '@/lib/lead-intelligence/discovery-query'
import { writeLeadAuditEvent } from '@/lib/lead-intelligence/audit'
import { trackLeadIntelligenceEvent } from '@/lib/lead-intelligence/telemetry'

function escapeCsv(value: unknown): string {
  const text = value == null ? '' : String(value)
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return 'company,industry,location,website,employees\n'
  const headers = ['company', 'industry', 'location', 'website', 'employees']
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      [row.companyName, row.industry, row.location, row.website, row.employeeCount].map(escapeCsv).join(',')
    ),
  ]
  return `${lines.join('\n')}\n`
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'lead-intelligence')
    const jobs = await prisma.leadExportJob.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    const items = jobs.map((job) => ({
      id: job.id,
      status: job.status,
      exportType: job.exportType,
      resultSummary: job.resultSummary,
      createdAt: job.createdAt,
    }))

    await writeLeadAuditEvent({
      tenantId,
      actorId: userId,
      action: 'export_history_viewed',
      entityType: 'lead_export',
      entityId: 'list',
      metadata: { count: items.length },
    })
    trackLeadIntelligenceEvent('export_history_viewed')

    return NextResponse.json({
      ok: true,
      items,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('[lead-intelligence/exports] GET failed:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let auditCtx: { tenantId: string; userId: string; query?: { q: string; industry: string; country: string; limit: number } } | null = null
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'lead-intelligence')
    const body = (await request.json()) as { q?: string; industry?: string; country?: string; limit?: number }
    const searchParams = new URLSearchParams()
    if (body?.q) searchParams.set('q', body.q)
    if (body?.industry) searchParams.set('industry', body.industry)
    if (body?.country) searchParams.set('country', body.country)
    if (body?.limit != null) searchParams.set('limit', String(body.limit))
    const query = parseDiscoveryQuery(searchParams)
    auditCtx = { tenantId, userId, query: { q: query.q, industry: query.industry, country: query.country, limit: query.limit } }
    const where = buildAccountDiscoveryWhere(tenantId, query)

    const rows = await prisma.account.findMany({
      where,
      select: {
        id: true,
        name: true,
        industry: true,
        website: true,
        city: true,
        state: true,
        country: true,
        employeeCount: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      take: query.limit,
    })

    const normalized = rows.map(normalizeDiscoveryAccountRow)
    const csv = toCsv(normalized)
    const resultSummary = {
      rowCount: normalized.length,
      source: 'tenant-account-index',
      generatedAt: new Date().toISOString(),
      query: { q: query.q, industry: query.industry, country: query.country, limit: query.limit },
    }

    const job = await prisma.leadExportJob.create({
      data: {
        tenantId,
        initiatedById: userId,
        status: 'COMPLETED',
        exportType: 'companies_csv',
        payload: resultSummary,
        resultSummary,
      },
    })

    await writeLeadAuditEvent({
      tenantId,
      actorId: userId,
      action: 'export_requested',
      entityType: 'lead_export',
      entityId: job.id,
      metadata: {
        exportType: 'companies_csv',
        rowCount: normalized.length,
        query: { q: query.q, industry: query.industry, country: query.country, limit: query.limit },
      },
    })
    trackLeadIntelligenceEvent('export_requested')
    trackLeadIntelligenceEvent(normalized.length > 0 ? 'export_csv_nonempty' : 'export_csv_empty')

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      filename: `lead-intelligence-companies-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      rowCount: normalized.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('[lead-intelligence/exports] POST failed:', error)
    if (auditCtx) {
      const failureSummary = {
        error: error instanceof Error ? error.message : 'unknown',
        generatedAt: new Date().toISOString(),
        query: auditCtx.query ?? null,
      }
      try {
        const failedJob = await prisma.leadExportJob.create({
          data: {
            tenantId: auditCtx.tenantId,
            initiatedById: auditCtx.userId,
            status: 'FAILED',
            exportType: 'companies_csv',
            payload: failureSummary,
            resultSummary: failureSummary,
          },
        })
        await writeLeadAuditEvent({
          tenantId: auditCtx.tenantId,
          actorId: auditCtx.userId,
          action: 'export_failed',
          entityType: 'lead_export',
          entityId: failedJob.id,
          metadata: failureSummary,
        })
        trackLeadIntelligenceEvent('export_failed')
      } catch (recordError) {
        console.warn('[lead-intelligence/exports] failed to record failed export job:', recordError)
      }
    }
    return NextResponse.json(
      { ok: false, error: 'Export failed. Please retry.', retryable: true },
      { status: 500 }
    )
  }
}
