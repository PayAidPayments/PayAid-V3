import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

type Recommendation = {
  id: string
  priority: 'high' | 'medium' | 'low'
  title: string
  reason: string
  suggested_action: string
}

export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')
    const url = new URL(request.url)
    const windowDays = Math.min(parseInt(url.searchParams.get('window_days') ?? '30', 10), 90)

    // Reuse the existing KPI scorecard route to derive deterministic recommendations.
    const scorecardUrl = new URL('/api/v1/kpi/scorecard', request.url)
    scorecardUrl.searchParams.set('window_days', String(windowDays))
    const scorecardRes = await fetch(scorecardUrl, {
      headers: { authorization: request.headers.get('authorization') || '' },
      cache: 'no-store',
    })
    if (!scorecardRes.ok) {
      return NextResponse.json({ error: 'Failed to build recommendations' }, { status: 502 })
    }
    const scorecard = (await scorecardRes.json()) as any
    const m = scorecard?.metrics || {}

    const recs: Recommendation[] = []

    if ((m.automation_reliability?.failure_rate_pct ?? 0) >= 5) {
      recs.push({
        id: 'automation-failure-rate',
        priority: 'high',
        title: 'Reduce automation failure rate',
        reason: `Failure rate is ${m.automation_reliability.failure_rate_pct ?? 'high'}%.`,
        suggested_action: 'Review top failed workflow runs and add retry-safe guards for the top 3 failing paths.',
      })
    }
    if ((m.unibox_sla?.resolution_rate_pct ?? 0) < 80 && (m.unibox_sla?.conversations_ingested ?? 0) > 0) {
      recs.push({
        id: 'unibox-resolution',
        priority: 'high',
        title: 'Improve Unibox resolution SLA',
        reason: `Resolution rate is ${m.unibox_sla.resolution_rate_pct ?? 0}% (< 80%).`,
        suggested_action: 'Create response macros for top unresolved categories and assign daily ownership.',
      })
    }
    if ((m.signal_to_first_action?.median_ms ?? 0) > 30000) {
      recs.push({
        id: 'signal-latency',
        priority: 'medium',
        title: 'Lower signal-to-action latency',
        reason: `Median latency is ${Math.round((m.signal_to_first_action.median_ms ?? 0) / 1000)}s.`,
        suggested_action: 'Enable auto-assignment for high-intent signals and trigger workflows directly from signal ingestion.',
      })
    }
    if ((m.quote_to_invoice_conversion?.median_hours ?? 0) > 48) {
      recs.push({
        id: 'quote-conversion-time',
        priority: 'medium',
        title: 'Accelerate quote-to-invoice cycle',
        reason: `Median conversion time is ${m.quote_to_invoice_conversion.median_hours ?? 0}h.`,
        suggested_action: 'Auto-follow up pending approvals after 24h and prefill invoice conversion defaults.',
      })
    }
    if ((m.ai_suggestion_acceptance?.ai_acceptance_rate_pct ?? 0) < 40 && (m.ai_suggestion_acceptance?.total_calls ?? 0) > 0) {
      recs.push({
        id: 'ai-acceptance',
        priority: 'low',
        title: 'Increase AI acceptance',
        reason: `AI acceptance is ${m.ai_suggestion_acceptance.ai_acceptance_rate_pct ?? 0}%.`,
        suggested_action: 'Review top overrides and tune prompts/guardrails for the highest-frequency rejection reasons.',
      })
    }

    if (recs.length === 0) {
      recs.push({
        id: 'maintain-performance',
        priority: 'low',
        title: 'Maintain current KPI performance',
        reason: 'All KPI metrics are currently within target thresholds.',
        suggested_action: 'Keep weekly KPI review cadence and monitor regression alerts.',
      })
    }

    return NextResponse.json({
      window_days: windowDays,
      recommendations: recs,
      generated_at: new Date().toISOString(),
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('KPI recommendations error:', e)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}

