import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { AdvancedTelephonyService } from '@/lib/telephony/advanced-features'
import { z } from 'zod'

const forwardingRuleSchema = z.object({
  name: z.string().min(1),
  conditions: z.object({
    timeOfDay: z.object({ start: z.string(), end: z.string() }).optional(),
    dayOfWeek: z.array(z.number()).optional(),
    callerId: z.string().optional(),
  }),
  forwardTo: z.string().min(1),
  enabled: z.boolean().default(true),
})

/**
 * POST /api/telephony/call-forwarding
 * Create call forwarding rule
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = forwardingRuleSchema.parse(body)

    const rule = await AdvancedTelephonyService.createCallForwardingRule(tenantId, validated)

    return NextResponse.json({
      success: true,
      data: rule,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create forwarding rule error:', error)
    return NextResponse.json(
      { error: 'Failed to create forwarding rule' },
      { status: 500 }
    )
  }
}
