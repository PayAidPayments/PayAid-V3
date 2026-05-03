// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getPayAidPayments } from '@/lib/payments/payaid'
import { authenticateRequest } from '@/lib/middleware/auth'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'
import { z } from 'zod'

const refundSchema = z.object({
  transaction_id: z.string().min(1), // Transaction ID from PayAid Payments
  merchant_refund_id: z.string().optional(), // Unique refund reference (recommended)
  merchant_order_id: z.string().optional(), // Original order ID
  amount: z.number().positive(), // Refund amount (must be <= transaction amount)
  description: z.string().min(1), // Reason for refund
})

// POST /api/payments/refund - Create refund request
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = user.tenantId || 'tenant_unknown'
    const userId = user.userId || 'user_unknown'
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()

    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `payment:refund:${idempotencyKey}`)
      const existingSnapshot = existing?.afterSnapshot as { transaction_id?: string } | null
      if (existing && existingSnapshot) {
        return NextResponse.json({
          deduplicated: true,
          data: {
            transaction_id: existingSnapshot.transaction_id ?? null,
          },
        })
      }
    }

    const body = await request.json()
    const validated = refundSchema.parse(body)
    
    const payaid = getPayAidPayments()
    const refund = await payaid.createRefund(validated)

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `payment:refund:${idempotencyKey}`, {
        transaction_id: validated.transaction_id,
        merchant_refund_id: validated.merchant_refund_id ?? null,
      })
    }

    return NextResponse.json({ data: refund })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Refund creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create refund' },
      { status: 500 }
    )
  }
}


