import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const bodySchema = z.object({
  monthlyBudgetInr: z.number().int().min(0).nullable().optional(),
  waMonthlyBudgetInr: z.number().int().min(0).nullable().optional(),
  emailMonthlyBudgetInr: z.number().int().min(0).nullable().optional(),
  smsMonthlyBudgetInr: z.number().int().min(0).nullable().optional(),
  dailyContactCap: z.number().int().min(0).nullable().optional(),
  weeklyContactCap: z.number().int().min(0).nullable().optional(),
  quietHoursStart: z.number().int().min(0).max(23).nullable().optional(),
  quietHoursEnd: z.number().int().min(0).max(23).nullable().optional(),
})

/** GET /api/marketing/settings */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const row = await prisma.marketingSettings.findUnique({ where: { tenantId } })
    return NextResponse.json({ settings: row })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Marketing settings GET:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

/** POST /api/marketing/settings — upsert */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const body = await request.json()
    const data = bodySchema.parse(body)

    const settings = await prisma.marketingSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        monthlyBudgetInr: data.monthlyBudgetInr ?? null,
        waMonthlyBudgetInr: data.waMonthlyBudgetInr ?? null,
        emailMonthlyBudgetInr: data.emailMonthlyBudgetInr ?? null,
        smsMonthlyBudgetInr: data.smsMonthlyBudgetInr ?? null,
        dailyContactCap: data.dailyContactCap ?? null,
        weeklyContactCap: data.weeklyContactCap ?? null,
        quietHoursStart: data.quietHoursStart ?? null,
        quietHoursEnd: data.quietHoursEnd ?? null,
      },
      update: {
        monthlyBudgetInr: data.monthlyBudgetInr ?? null,
        waMonthlyBudgetInr: data.waMonthlyBudgetInr ?? null,
        emailMonthlyBudgetInr: data.emailMonthlyBudgetInr ?? null,
        smsMonthlyBudgetInr: data.smsMonthlyBudgetInr ?? null,
        dailyContactCap: data.dailyContactCap ?? null,
        weeklyContactCap: data.weeklyContactCap ?? null,
        quietHoursStart: data.quietHoursStart ?? null,
        quietHoursEnd: data.quietHoursEnd ?? null,
      },
    })

    return NextResponse.json({ settings })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Marketing settings POST:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
