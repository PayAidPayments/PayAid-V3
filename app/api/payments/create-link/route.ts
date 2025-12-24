import { NextRequest, NextResponse } from 'next/server'
import { getPayAidPayments } from '@/lib/payments/payaid'
import { z } from 'zod'

const createPaymentLinkSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  orderId: z.string().optional(),
  callbackUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validated = createPaymentLinkSchema.parse(body)
    
    // Ensure currency is INR
    const payaid = getPayAidPayments()
    const paymentLink = await payaid.createPaymentLink({
      ...validated,
      currency: 'INR', // Always INR
      notify: {
        sms: true,
        email: true,
      },
    })

    return NextResponse.json(paymentLink)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Payment link creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    )
  }
}

