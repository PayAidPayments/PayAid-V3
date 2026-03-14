/**
 * Phase 1A — Agent #1: Retail Inventory Agent
 * POST /api/agents/retail-inventory — Run agent for authenticated tenant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { runRetailInventoryAgent } from '@/lib/agents/retail-inventory-agent'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const result = await runRetailInventoryAgent(tenantId)
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Retail inventory agent error:', error)
    return NextResponse.json(
      { error: 'Agent run failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
