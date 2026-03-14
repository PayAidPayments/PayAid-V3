import { NextRequest, NextResponse } from 'next/server'
import { getPayAidPayments } from '@/lib/payments/payaid'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const paymentStatusSchema = z.object({
  order_id: z.string().optional(),
  transaction_id: z.string().optional(),
  bank_code: z.string().optional(),
  response_code: z.number().optional(),
  customer_phone: z.string().optional(),
  customer_email: z.string().email().optional(),
  customer_name: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page_number: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(50).optional(),
})

// POST /api/payments/status - Get payment status
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = paymentStatusSchema.parse(body)

    // At least one parameter is required
    if (!validated.order_id && !validated.transaction_id && !validated.customer_phone && 
        !validated.customer_email && !validated.date_from) {
      return NextResponse.json(
        { error: 'At least one search parameter is required' },
        { status: 400 }
      )
    }

    const payaid = getPayAidPayments()
    const status = await payaid.getPaymentStatus(validated)

    return NextResponse.json(status)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Payment status error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    )
  }
}
