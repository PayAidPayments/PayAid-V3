import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { buildSalesAutomationWorkspace } from '@/lib/crm/sales-automation-workspace-server'

/**
 * GET /api/crm/sales-automation/workspace
 *
 * Aggregated tenant data for the Sales Automation command center:
 * KPIs, nurture + broadcast automations, workflows, execution log slice,
 * prospect queue slice, signals, templates, deliverability snapshot.
 *
 * Query: dateRange=7d|30d|90d, channel, status, search, queueSkip, queueTake, logSkip, logTake
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const sp = request.nextUrl.searchParams
    const dr = sp.get('dateRange') || '30d'
    const dateRangeDays = dr === '7d' ? 7 : dr === '90d' ? 90 : 30
    const queueSkip = Math.max(0, parseInt(sp.get('queueSkip') || '0', 10) || 0)
    const queueTake = Math.min(200, Math.max(1, parseInt(sp.get('queueTake') || '50', 10) || 50))
    const logSkip = Math.max(0, parseInt(sp.get('logSkip') || '0', 10) || 0)
    const logTake = Math.min(200, Math.max(1, parseInt(sp.get('logTake') || '40', 10) || 40))
    const search = sp.get('search') || ''
    const channelFilter = sp.get('channel') || 'all'
    const statusFilter = sp.get('status') || 'all'

    const payload = await buildSalesAutomationWorkspace(prisma, tenantId, {
      dateRangeDays,
      queueSkip,
      queueTake,
      logSkip,
      logTake,
      search,
      channelFilter,
      statusFilter,
    })

    return NextResponse.json(payload)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Sales automation workspace error:', error)
    return NextResponse.json(
      { error: 'Failed to load workspace', message },
      { status: 500 }
    )
  }
}
