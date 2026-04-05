import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

const updateRuleSchema = z.object({
  key: z.string().min(1).optional(),
  category: z.enum(['fit', 'engagement', 'negative']).optional(),
  weight: z.number().min(-100).max(100).optional(),
  active: z.boolean().optional(),
  configJson: z.any().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params
    const body = await request.json()
    const parsed = updateRuleSchema.parse(body)

    const rule = await prisma.leadScoreRule.updateMany({
      where: { id, tenantId },
      data: parsed,
    })

    if (rule.count === 0) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 })
    }

    const updated = await prisma.leadScoreRule.findFirst({ where: { id, tenantId } })
    return NextResponse.json({ success: true, rule: updated })
  } catch (error: any) {
    console.error('Update scoring rule error:', error)
    const status = error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}
