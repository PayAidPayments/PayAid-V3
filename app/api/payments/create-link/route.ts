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
    const paymentLink = await payaid.getPaymentRequestUrl({
      order_id: validated.orderId || `ORDER-${Date.now()}`,
      amount: validated.amount,
      currency: 'INR', // Always INR
      description: validated.description,
      name: validated.customer.name,
      email: validated.customer.email,
      phone: validated.customer.phone || '',
      city: '',
      country: 'India',
      zip_code: '',
      return_url: validated.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/callback/success`,
      return_url_failure: validated.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/callback/failure`,
      return_url_cancel: validated.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/callback/cancel`,
      expiry_in_minutes: 10080, // 7 days
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

