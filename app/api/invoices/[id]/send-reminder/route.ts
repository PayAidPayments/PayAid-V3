/**
 * Send Reminder for Specific Invoice
 * POST /api/invoices/[id]/send-reminder - Send overdue reminder for specific invoice
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { sendOverdueReminder } from '@/lib/automation/overdue-payment-reminders'
import { z } from 'zod'

const sendReminderSchema = z.object({
  channel: z.enum(['email', 'sms', 'whatsapp']).default('email'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()
    const validated = sendReminderSchema.parse(body)

    const result = await sendOverdueReminder(params.id, validated.channel, tenantId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send reminder' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      data: result,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Send reminder error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminder', message: error.message },
      { status: 500 }
    )
  }
}
