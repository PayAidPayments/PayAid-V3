import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { generateRazorpayPaymentLink } from '@/lib/integrations/payments/razorpay'
import { z } from 'zod'

const createPaymentLinkSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  description: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  invoiceId: z.string().optional(),
})

/** POST /api/integrations/razorpay/payment-link - Generate Razorpay payment link */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = createPaymentLinkSchema.parse(body)

    // Get Razorpay installation config
    const installation = await prisma.marketplaceAppInstallation.findFirst({
      where: {
        tenantId,
        appId: 'razorpay-connector',
        status: 'active',
      },
    })

    if (!installation) {
      return NextResponse.json(
        { error: 'Razorpay integration is not installed' },
        { status: 404 }
      )
    }

    const config = installation.config as any
    if (!config.apiKey || !config.apiSecret) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured' },
        { status: 400 }
      )
    }

    const result = await generateRazorpayPaymentLink(
      {
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
      },
      validated.amount,
      validated.currency,
      validated.description,
      {
        name: validated.customerName,
        email: validated.customerEmail,
        contact: validated.customerPhone,
      },
      validated.invoiceId ? { invoice_id: validated.invoiceId } : undefined
    )

    return NextResponse.json({
      paymentLinkId: result.paymentLinkId,
      shortUrl: result.shortUrl,
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create payment link' },
      { status: 500 }
    )
  }
}
