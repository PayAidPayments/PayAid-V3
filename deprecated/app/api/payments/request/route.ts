import { NextRequest, NextResponse } from 'next/server'
import { getPayAidPayments } from '@/lib/payments/payaid'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const paymentRequestSchema = z.object({
  order_id: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  description: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  country: z.string().default('India'),
  zip_code: z.string().min(1),
  return_url: z.string().url(),
  return_url_failure: z.string().url().optional(),
  return_url_cancel: z.string().url().optional(),
  mode: z.enum(['TEST', 'LIVE']).optional(),
  use_encryption: z.boolean().default(false),
  use_two_step: z.boolean().default(false), // Use getPaymentRequestUrl instead
  expiry_in_minutes: z.number().min(15).max(10080).optional(),
})

// POST /api/payments/request - Create payment request
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = paymentRequestSchema.parse(body)

    const payaid = getPayAidPayments()

    let paymentResponse: any

    if (validated.use_two_step) {
      // Two Step Integration - Get Payment URL
      paymentResponse = await payaid.getPaymentRequestUrl({
        ...validated,
        expiry_in_minutes: validated.expiry_in_minutes || 60,
      })
    } else if (validated.use_encryption) {
      // Encrypted Payment Request
      paymentResponse = await payaid.createEncryptedPaymentRequest(validated)
    } else {
      // Regular Payment Request
      paymentResponse = await payaid.createPaymentRequest(validated)
    }

    return NextResponse.json(paymentResponse, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Payment request error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment request' },
      { status: 500 }
    )
  }
}
