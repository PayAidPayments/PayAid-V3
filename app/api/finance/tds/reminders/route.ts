/**
 * GET /api/finance/tds/reminders
 * Returns TDS return due dates within the next N days (default 7). For in-app banners and email/cron.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

function getTDSDueDates(year: number) {
  return [
    { form: '26Q', period: `Q1 (Apr-Jun ${year})`, dueDate: new Date(year, 6, 31), description: 'TDS on salary (if applicable)' },
    { form: '26Q', period: `Q2 (Jul-Sep ${year})`, dueDate: new Date(year, 9, 31), description: 'TDS on salary' },
    { form: '26Q', period: `Q3 (Oct-Dec ${year})`, dueDate: new Date(year, 11, 31), description: 'TDS on salary' },
    { form: '26Q', period: `Q4 (Jan-Mar ${year + 1})`, dueDate: new Date(year + 1, 0, 31), description: 'TDS on salary' },
    { form: '24Q', period: `Q4 (Jan-Mar ${year + 1})`, dueDate: new Date(year + 1, 4, 31), description: 'TDS on non-salary (payments other than salary)' },
  ]
}

export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'finance')
    const { searchParams } = new URL(request.url)
    const daysAhead = Math.min(Math.max(parseInt(searchParams.get('days') || '7', 10), 1), 60)
    const now = new Date()
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() + daysAhead)
    cutoff.setHours(23, 59, 59, 999)

    const currentYear = now.getFullYear()
    const allDue = [
      ...getTDSDueDates(currentYear - 1),
      ...getTDSDueDates(currentYear),
      ...getTDSDueDates(currentYear + 1),
    ]

    const reminders = allDue
      .filter((d) => {
        const due = new Date(d.dueDate)
        return due >= now && due <= cutoff
      })
      .map((d) => {
        const due = new Date(d.dueDate)
        const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return {
          form: d.form,
          period: d.period,
          dueDate: d.dueDate.toISOString(),
          description: d.description,
          daysLeft,
        }
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    return NextResponse.json({ reminders, daysAhead })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
