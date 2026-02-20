/**
 * Smart Reminder API Route
 * POST /api/invoices/[id]/smart-reminder - Send smart reminder
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { generatePersonalizedReminder } from '@/lib/automation/smart-reminders'

/** POST /api/invoices/[id]/smart-reminder - Send smart reminder */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { id } = await params

    const reminder = await generatePersonalizedReminder(id, tenantId)

    return NextResponse.json({
      success: true,
      reminder,
    })
  } catch (error: any) {
    console.error('Generate smart reminder error:', error)
    return NextResponse.json(
      { error: 'Failed to generate reminder', message: error.message },
      { status: 500 }
    )
  }
}
