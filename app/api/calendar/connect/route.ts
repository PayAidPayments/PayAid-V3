/**
 * Calendar Connection API
 * POST /api/calendar/connect - Connect Google/Outlook calendar
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { CalendarSyncService } from '@/lib/calendar/calendar-sync'
import { z } from 'zod'

const connectCalendarSchema = z.object({
  provider: z.enum(['google', 'outlook']),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
})

// POST /api/calendar/connect - Connect calendar
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = connectCalendarSchema.parse(body)

    const result = await CalendarSyncService.connectCalendar(
      tenantId,
      userId,
      validated.provider,
      validated.accessToken,
      validated.refreshToken
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

    console.error('Connect calendar error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect calendar' },
      { status: 500 }
    )
  }
}
