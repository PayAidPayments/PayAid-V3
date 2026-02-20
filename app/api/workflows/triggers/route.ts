import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { WORKFLOW_EVENTS, TRIGGER_TYPES, ACTION_TYPES } from '@/lib/workflow/types'

/** GET /api/workflows/triggers - List available trigger and action definitions for the builder */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')
    return NextResponse.json({
      triggerTypes: TRIGGER_TYPES,
      events: WORKFLOW_EVENTS,
      actionTypes: ACTION_TYPES,
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unauthorized' },
      { status: 500 }
    )
  }
}
