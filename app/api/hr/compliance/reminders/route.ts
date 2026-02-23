import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/hr/compliance/reminders
 * Deferred Phase 2: Next due dates for PF/ECR, ESI, TDS/24Q, PT. Use from cron to send reminders.
 */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    const reminders = [
      { type: 'PF_ECR', name: 'PF ECR', dueDay: 15, dueMonth: month, dueYear: year, description: 'Upload ECR to EPFO portal' },
      { type: 'ESI', name: 'ESI', dueDay: 21, dueMonth: month, dueYear: year, description: 'File ESI return' },
      { type: 'TDS_24Q', name: 'TDS 24Q', dueDay: 31, dueMonth: month <= 3 ? month + 9 : month - 3, dueYear: month <= 3 ? year - 1 : year, description: 'Quarterly TDS statement (Q ending)' },
      { type: 'PT', name: 'Professional Tax', dueDay: 5, dueMonth: month, dueYear: year, description: 'Pay PT for the month' },
    ].map((r) => {
      const due = new Date(r.dueYear, r.dueMonth - 1, r.dueDay)
      const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...r,
        dueDate: due.toISOString().slice(0, 10),
        daysLeft,
        status: daysLeft < 0 ? 'OVERDUE' : daysLeft <= 7 ? 'DUE_SOON' : 'UPCOMING',
      }
    })

    return NextResponse.json({
      reminders,
      generatedAt: new Date().toISOString(),
      note: 'Configure a cron to call this API and send email/WhatsApp reminders when status is DUE_SOON or OVERDUE.',
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
