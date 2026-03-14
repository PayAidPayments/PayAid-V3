import { NextRequest, NextResponse } from 'next/server'
import { getPayAidPayments } from '@/lib/payments/payaid'
import { authenticateRequest } from '@/lib/middleware/auth'
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

    const body = await request.json()
    const validated = refundSchema.parse(body)
    
    const payaid = getPayAidPayments()
    const refund = await payaid.createRefund(validated)

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


