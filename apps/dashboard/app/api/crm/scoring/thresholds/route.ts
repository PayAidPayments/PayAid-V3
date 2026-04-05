import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

const thresholdSchema = z.object({
  minValue: z.number().int().min(0).max(100),
  maxValue: z.number().int().min(0).max(100),
  label: z.string().min(1),
  actionPolicyJson: z.any().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const thresholds = await prisma.leadScoreThreshold.findMany({
      where: { tenantId },
      orderBy: [{ minValue: 'asc' }],
    })
    return NextResponse.json({ success: true, thresholds })
  } catch (error: any) {
    console.error('Get score thresholds error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const parsed = thresholdSchema.parse(body)

    if (parsed.minValue > parsed.maxValue) {
      return NextResponse.json(
        { success: false, error: 'minValue must be <= maxValue' },
        { status: 400 }
      )
    }

    const threshold = await prisma.leadScoreThreshold.create({
      data: { tenantId, ...parsed },
    })
    return NextResponse.json({ success: true, threshold }, { status: 201 })
  } catch (error: any) {
    console.error('Create score threshold error:', error)
    const status = error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}
