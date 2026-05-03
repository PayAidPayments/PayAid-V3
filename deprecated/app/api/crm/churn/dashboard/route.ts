/**
 * GET /api/crm/churn/dashboard
 * Phase 1B — Churn predictor dashboard data: segments, at-risk contacts, ₹ at risk.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { getChurnDashboard } from '@/lib/ai/churn-predictor'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const dashboard = await getChurnDashboard(tenantId)
    return NextResponse.json(dashboard)
  } catch (e) {
    console.error('Churn dashboard error:', e)
    return NextResponse.json(
      { error: 'Failed to load churn dashboard', details: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    )
  }
}
