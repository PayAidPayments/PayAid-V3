/**
 * Calendar Sync API
 * POST /api/calendar/sync - Sync calendar events to CRM
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { CalendarSyncService } from '@/lib/calendar/calendar-sync'
import { z } from 'zod'

const syncCalendarSchema = z.object({
  provider: z.enum(['google', 'outlook']),
})

// POST /api/calendar/sync - Sync calendar
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = syncCalendarSchema.parse(body)

    const result = await CalendarSyncService.syncCalendarToCRM(
      tenantId,
      userId,
      validated.provider
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Sync calendar error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync calendar' },
      { status: 500 }
    )
  }
}
