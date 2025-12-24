import { NextRequest, NextResponse } from 'next/server'
import { getPayAidPayments } from '@/lib/payments/payaid'
import { authenticateRequest } from '@/lib/middleware/auth'

// GET /api/payments/refund/status - Get refund status
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const transaction_id = searchParams.get('transaction_id')
    const merchant_order_id = searchParams.get('merchant_order_id')

    if (!transaction_id) {
      return NextResponse.json(
        { error: 'transaction_id is required' },
        { status: 400 }
      )
    }

    const payaid = getPayAidPayments()
    const refundStatus = await payaid.getRefundStatus({
      transaction_id,
      merchant_order_id: merchant_order_id || undefined,
    })

    return NextResponse.json({ data: refundStatus })
  } catch (error) {
    console.error('Refund status error:', error)
    return NextResponse.json(
      { error: 'Failed to get refund status' },
      { status: 500 }
    )
  }
}
