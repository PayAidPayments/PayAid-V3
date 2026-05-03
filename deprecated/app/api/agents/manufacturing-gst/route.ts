/**
 * Phase 1A — Agent #3: Manufacturing GST Compliance (stub).
 * TRIGGER: Monthly cron → invoices → GSTIN → e-invoice → GSTR-1.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')
    return NextResponse.json(
      { error: 'Coming soon', message: 'Manufacturing GST Compliance agent will be available in a future release.' },
      { status: 501 }
    )
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
