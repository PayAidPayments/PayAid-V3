import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'

const createRuleSchema = z.object({
  key: z.string().min(1),
  category: z.enum(['fit', 'engagement', 'negative']),
  weight: z.number().min(-100).max(100),
  active: z.boolean().optional(),
  configJson: z.any().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const rules = await prisma.leadScoreRule.findMany({
      where: { tenantId },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    })
    return NextResponse.json({ success: true, rules })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get scoring rules error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:scoring_rule:create:${idempotencyKey}`)
      const existingRuleId = (existing?.afterSnapshot as { rule_id?: string } | null)?.rule_id
      if (existing && existingRuleId) {
        return NextResponse.json({ success: true, deduplicated: true, rule: { id: existingRuleId } }, { status: 200 })
      }
    }
    const body = await request.json()
    const parsed = createRuleSchema.parse(body)

    const rule = await prisma.leadScoreRule.create({
      data: {
        tenantId,
        key: parsed.key,
        category: parsed.category,
        weight: parsed.weight,
        active: parsed.active ?? true,
        configJson: parsed.configJson,
      },
    })

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:scoring_rule:create:${idempotencyKey}`, {
        rule_id: rule.id,
      })
    }

    return NextResponse.json({ success: true, rule }, { status: 201 })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Create scoring rule error:', error)
    const status = error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}
