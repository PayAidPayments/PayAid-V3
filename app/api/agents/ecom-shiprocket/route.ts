/**
 * Phase 1A — Agent #5: Ecom Shiprocket Optimizer (stub).
 * TRIGGER: Order batch >10 → courier selection → bulk labels → tracking.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')
    return NextResponse.json(
      { error: 'Coming soon', message: 'Ecom Shiprocket Optimizer agent will be available in a future release.' },
      { status: 501 }
    )
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
