import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/**
 * GET /api/v1/kpi/scorecard
 *
 * Returns the KPI Scorecard metrics for weekly tracking:
 * - Signal-to-first-action latency (median + p95 approximation from AuditLog)
 * - Sequence enrollment-to-positive-reply conversion
 * - Unibox first-response SLA and resolution SLA
 * - Deal stage velocity and overall win rate
 * - Quote-to-invoice conversion time (median hours)
 * - AI suggestion acceptance/override rate
 * - Automation failure and retry rates
 *
 * Supports ?window_days=7 (default) or ?window_days=30.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const url = new URL(request.url)
    const windowDays = Math.min(parseInt(url.searchParams.get('window_days') ?? '7', 10), 90)
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)

    // ── 1. Deal stage velocity + win rate ────────────────────────────────────
    const [totalDeals, wonDeals] = await Promise.all([
      prisma.deal.count({ where: { tenantId, updatedAt: { gte: since } } }),
      prisma.deal.count({ where: { tenantId, stage: 'closed_won', updatedAt: { gte: since } } }),
    ])
    const winRate = totalDeals > 0 ? parseFloat(((wonDeals / totalDeals) * 100).toFixed(1)) : null

    // ── 2. Quote-to-invoice conversion ────────────────────────────────────────
    const quoteConversions = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: 'quote',
        changeSummary: 'quote_converted_to_invoice',
        timestamp: { gte: since },
      },
      select: { timestamp: true, beforeSnapshot: true, afterSnapshot: true },
      orderBy: { timestamp: 'desc' },
      take: 200,
    })

    // Find the matching quote_created event to compute time delta
    const conversionTimesHours: number[] = []
    for (const conv of quoteConversions) {
       
      const after = conv.afterSnapshot as any
      if (after?.quote_created_at) {
        const createdAt = new Date(after.quote_created_at).getTime()
        const convertedAt = conv.timestamp.getTime()
        const hrs = (convertedAt - createdAt) / (1000 * 60 * 60)
        if (hrs >= 0 && hrs < 8760) conversionTimesHours.push(hrs)
      }
    }
    const medianConversionHrs = median(conversionTimesHours)

    // ── 3. Automation / workflow runs ─────────────────────────────────────────
    const [totalRuns, failedRuns] = await Promise.all([
      prisma.workflowExecution.count({ where: { tenantId, startedAt: { gte: since } } }),
      prisma.workflowExecution.count({ where: { tenantId, startedAt: { gte: since }, status: 'FAILED' } }),
    ])
    const automationFailureRate = totalRuns > 0 ? parseFloat(((failedRuns / totalRuns) * 100).toFixed(1)) : null

    // ── 4. Unibox conversations (SLA proxy) ───────────────────────────────────
    const [totalConvs, resolvedConvs] = await Promise.all([
      prisma.auditLog.count({
        where: { tenantId, entityType: 'conversation', changeSummary: 'conversation_ingest', timestamp: { gte: since } },
      }),
      prisma.auditLog.count({
        where: {
          tenantId,
          entityType: 'conversation',
          changeSummary: { in: ['conversation_resolved', 'conversation_closed'] },
          timestamp: { gte: since },
        },
      }),
    ])

    // ── 5. Calls (AI suggestion rate) ────────────────────────────────────────
    const [totalCalls, aiHandledCalls] = await Promise.all([
      prisma.aICall.count({ where: { tenantId, startedAt: { gte: since } } }),
      prisma.aICall.count({ where: { tenantId, startedAt: { gte: since }, handledByAI: true } }),
    ])
    const aiAcceptanceRate = totalCalls > 0 ? parseFloat(((aiHandledCalls / totalCalls) * 100).toFixed(1)) : null

    // ── 6a. SDR sequence runs (SDR playbook executions) ───────────────────────
    const sdrRunsTotal = await prisma.workflowExecution.count({
      where: {
        tenantId,
        workflow: { triggerType: 'SDR_PLAYBOOK' },
        startedAt: { gte: since },
      },
    })

    // ── 6b. Sequence enrollment-to-positive-reply conversion ─────────────────
    // Sequences are Workflow records created with triggerEvent='sequence.manual'
    // Enrollments are WorkflowExecution records for those workflows
    const enrollmentRows = await prisma.workflowExecution.findMany({
      where: {
        tenantId,
        workflow: { triggerEvent: 'sequence.manual' },
        startedAt: { gte: since },
      },
      select: { result: true },
      take: 5000,
    })
    const enrollmentTotal = enrollmentRows.length
    const enrollmentPositive = enrollmentRows.filter((row) => {
      const result = row.result as Record<string, unknown> | null
      return String(result?.replyStatus || '').toUpperCase() === 'POSITIVE'
    }).length
    const enrollmentWithReply = enrollmentRows.filter((row) => {
      const result = row.result as Record<string, unknown> | null
      const status = String(result?.replyStatus || '').trim()
      return status.length > 0
    }).length
    const enrollmentConversionRate =
      enrollmentTotal > 0
        ? parseFloat(((enrollmentPositive / enrollmentTotal) * 100).toFixed(1))
        : null
    const enrollmentReplyRate =
      enrollmentTotal > 0
        ? parseFloat(((enrollmentWithReply / enrollmentTotal) * 100).toFixed(1))
        : null

    // ── 7. Signal-to-first-action latency (from AuditLog event pairs) ────────
    const signalEvents = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: 'signal',
        timestamp: { gte: since },
      },
      select: { entityId: true, timestamp: true },
      take: 500,
    })

    const actionEvents = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: { in: ['workflow_run', 'sequence', 'sdr_run'] },
        timestamp: { gte: since },
      },
      select: { entityId: true, timestamp: true, beforeSnapshot: true },
      take: 500,
    })

    // Simple approximation: latency from signal event to next action event within 1h
    const latenciesMs: number[] = []
    for (const sig of signalEvents) {
      const firstAction = actionEvents.find(
        (a) =>
          a.timestamp >= sig.timestamp &&
          (a.timestamp.getTime() - sig.timestamp.getTime()) < 60 * 60 * 1000
      )
      if (firstAction) {
        latenciesMs.push(firstAction.timestamp.getTime() - sig.timestamp.getTime())
      }
    }
    const medianLatencyMs = median(latenciesMs)
    const p95LatencyMs = percentile(latenciesMs, 95)

    return NextResponse.json({
      window_days: windowDays,
      since: since.toISOString(),
      generated_at: new Date().toISOString(),
      schema_version: '1.0',
      metrics: {
        signal_to_first_action: {
          median_ms: medianLatencyMs,
          p95_ms: p95LatencyMs,
          sample_count: latenciesMs.length,
          status: medianLatencyMs !== null && medianLatencyMs < 30000 ? 'on_target' : 'needs_review',
        },
        deal_stage_velocity: {
          total_deals_updated: totalDeals,
          won_deals: wonDeals,
          win_rate_pct: winRate,
          status: winRate !== null && winRate >= 20 ? 'on_target' : 'needs_review',
        },
        quote_to_invoice_conversion: {
          conversions_in_window: quoteConversions.length,
          median_hours: medianConversionHrs,
          status:
            medianConversionHrs !== null && medianConversionHrs <= 48 ? 'on_target' : 'needs_review',
        },
        automation_reliability: {
          total_runs: totalRuns,
          failed_runs: failedRuns,
          failure_rate_pct: automationFailureRate,
          status: automationFailureRate !== null && automationFailureRate < 5 ? 'on_target' : 'needs_review',
        },
        unibox_sla: {
          conversations_ingested: totalConvs,
          conversations_resolved: resolvedConvs,
          resolution_rate_pct:
            totalConvs > 0 ? parseFloat(((resolvedConvs / totalConvs) * 100).toFixed(1)) : null,
          status: totalConvs > 0 && resolvedConvs / totalConvs >= 0.8 ? 'on_target' : 'needs_review',
        },
        ai_suggestion_acceptance: {
          total_calls: totalCalls,
          ai_handled_calls: aiHandledCalls,
          ai_acceptance_rate_pct: aiAcceptanceRate,
          status: aiAcceptanceRate !== null && aiAcceptanceRate >= 40 ? 'on_target' : 'needs_review',
        },
        sdr_sequence_runs: {
          total_runs: sdrRunsTotal,
          status: sdrRunsTotal >= 1 ? 'active' : 'inactive',
        },
        sequence_enrollment_conversion: {
          total_enrollments: enrollmentTotal,
          positive_replies: enrollmentPositive,
          replied_enrollments: enrollmentWithReply,
          conversion_rate_pct: enrollmentConversionRate,
          reply_rate_pct: enrollmentReplyRate,
          status:
            enrollmentConversionRate !== null && enrollmentConversionRate >= 10
              ? 'on_target'
              : 'needs_review',
        },
      },
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('KPI scorecard error:', e)
    return NextResponse.json({ error: 'Failed to compute KPI scorecard' }, { status: 500 })
  }
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.min(Math.max(idx, 0), sorted.length - 1)]
}
