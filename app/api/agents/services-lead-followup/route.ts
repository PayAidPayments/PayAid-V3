/**
 * Phase 1A — Agent #2: Services Lead Follow-up (stub).
 * TRIGGER: Lead score >70 + no reply in 48h → WhatsApp nudge → email → call script.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')
    return NextResponse.json(
      { error: 'Coming soon', message: 'Services Lead Follow-up agent will be available in a future release.' },
      { status: 501 }
    )
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
