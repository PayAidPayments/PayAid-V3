/**
 * Phase 1A — Agent #4: F&B Revenue Optimizer (stub).
 * TRIGGER: Weekly sales dip → menu performance → price/promos → Swiggy/Zomato.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')
    return NextResponse.json(
      { error: 'Coming soon', message: 'F&B Revenue Optimizer agent will be available in a future release.' },
      { status: 501 }
    )
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
