/**
 * Overdue Payment Reminders API Route
 * GET /api/invoices/overdue-reminders - Get overdue invoices needing reminders
 * POST /api/invoices/overdue-reminders - Send reminders for overdue invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import {
  getOverdueInvoicesNeedingReminders,
  processOverdueReminders,
  sendOverdueReminder,
  type ReminderConfig,
} from '@/lib/automation/overdue-payment-reminders'
import { z } from 'zod'

const reminderConfigSchema = z.object({
  enabled: z.boolean().default(true),
  schedule: z.object({
    daysAfterDue: z.array(z.number()).default([3, 7, 14, 30]),
    channels: z.array(z.enum(['email', 'sms', 'whatsapp'])).default(['email']),
    escalation: z.boolean().default(true),
  }),
  maxReminders: z.number().default(5),
  stopAfterPayment: z.boolean().default(true),
})

// GET /api/invoices/overdue-reminders - Get overdue invoices
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const configParam = searchParams.get('config')
    const defaultConfig: ReminderConfig = {
      enabled: true,
      schedule: {
        daysAfterDue: [3, 7, 14, 30],
        channels: ['email'],
        escalation: true,
      },
      maxReminders: 5,
      stopAfterPayment: true,
    }

    const config = configParam ? JSON.parse(configParam) : defaultConfig
    const validatedConfig = reminderConfigSchema.parse(config)

    const overdue = await getOverdueInvoicesNeedingReminders(tenantId, validatedConfig)

    return NextResponse.json({
      success: true,
      data: overdue,
      count: overdue.length,
    })
  } catch (error: any) {
    console.error('Get overdue reminders error:', error)
    return NextResponse.json(
      { error: 'Failed to get overdue reminders', message: error.message },
      { status: 500 }
    )
  }
}

// POST /api/invoices/overdue-reminders - Process and send reminders
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const body = await request.json()
    const config = reminderConfigSchema.parse(body.config || {})

    // Process all overdue reminders
    const result = await processOverdueReminders(tenantId, config)

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} invoices, sent ${result.sent} reminders`,
      data: result,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Process overdue reminders error:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders', message: error.message },
      { status: 500 }
    )
  }
}
