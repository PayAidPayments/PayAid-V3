import { NextRequest, NextResponse } from 'next/server'
import { getPayAidPayments } from '@/lib/payments/payaid'
import { prisma } from '@/lib/db/prisma'
import { highPriorityQueue } from '@/lib/queue/bull'

/**
 * Payment Callback Handler
 * PayAid Payments redirects customer here after payment
 * 
 * This endpoint receives POST request with payment response parameters
 * Must verify hash before processing
 */
export async function POST(request: NextRequest) {
  try {
    // Get form data (PayAid Payments sends POST form data)
    const formData = await request.formData()
    
    // Convert form data to object
    const responseData: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      responseData[key] = value.toString()
    }

    const payaid = getPayAidPayments()
    
    // Verify response hash
    if (!payaid.verifyWebhookSignature(responseData)) {
      return NextResponse.json(
        { error: 'Invalid response hash' },
        { status: 401 }
      )
    }

    const {
      transaction_id,
      order_id,
      response_code,
      response_message,
      amount,
      payment_mode,
      payment_channel,
      payment_datetime,
    } = responseData

    // Process payment callback asynchronously
    await highPriorityQueue.add('process-payment-callback', {
      transaction_id,
      order_id,
      response_code: parseInt(response_code) || 0,
      response_message,
      amount: parseFloat(amount) || 0,
      payment_mode,
      payment_channel,
      payment_datetime,
      full_response: responseData,
    })

    // Redirect based on response code
    // 0 = success, non-zero = error
    if (response_code === '0') {
      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/orders/${order_id}?payment=success&transaction_id=${transaction_id}`, request.url)
      )
    } else {
      // Redirect to failure page
      return NextResponse.redirect(
        new URL(`/orders/${order_id}?payment=failed&error=${encodeURIComponent(response_message)}`, request.url)
      )
    }
  } catch (error) {
    console.error('Payment callback error:', error)
    // Redirect to error page
    return NextResponse.redirect(
      new URL('/orders?payment=error', request.url)
    )
  }
}

/**
 * GET handler for payment callback (fallback)
 * Some browsers may use GET for redirects
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Check if this is a redirect from PayAid Payments
    const transaction_id = searchParams.get('transaction_id')
    const order_id = searchParams.get('order_id')
    const response_code = searchParams.get('response_code')

    if (transaction_id && order_id) {
      // Fetch payment status from API
      const payaid = getPayAidPayments()
      const status = await payaid.getPaymentStatus({
        transaction_id,
        order_id,
      })

      if (status.data && status.data.length > 0) {
        const payment = status.data[0]
        
        if (payment.response_code === 0) {
          return NextResponse.redirect(
            new URL(`/orders/${order_id}?payment=success&transaction_id=${transaction_id}`, request.url)
          )
        } else {
          return NextResponse.redirect(
            new URL(`/orders/${order_id}?payment=failed&error=${encodeURIComponent(payment.response_message)}`, request.url)
          )
        }
      }
    }

    // Default redirect
    return NextResponse.redirect(new URL('/orders', request.url))
  } catch (error) {
    console.error('Payment callback GET error:', error)
    return NextResponse.redirect(new URL('/orders?payment=error', request.url))
  }
}
