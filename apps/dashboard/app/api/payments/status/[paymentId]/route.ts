import { NextRequest, NextResponse } from 'next/server'
import { getPayAidPayments } from '@/lib/payments/payaid'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const resolvedParams = await params
    const { paymentId } = resolvedParams
    
    const payaid = getPayAidPayments()
    const status = await payaid.getPaymentStatus({ order_id: paymentId })

    return NextResponse.json(status)
  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    )
  }
}

