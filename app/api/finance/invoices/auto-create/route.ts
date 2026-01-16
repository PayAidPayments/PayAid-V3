import { NextRequest, NextResponse } from 'next/server';

/**
 * Finance Module - Auto-create Invoice from Order
 * Called by API Gateway when order.created event is received
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    // Verify service key (internal API Gateway calls)
    const serviceKey = request.headers.get('X-Service-Key');
    const expectedKey = process.env.API_GATEWAY_KEY || 'internal-service-key';
    
    if (serviceKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { order_id, customer_id, amount, order_data } = body;

    if (!order_id || !customer_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, customer_id, amount' },
        { status: 400 }
      );
    }

    // Create invoice from order
    // In production, you would fetch the order details and create a proper invoice
    const invoiceData = {
      customerId: customer_id,
      orderId: order_id,
      amount: amount,
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      items: order_data?.items || [],
    };

    // Call the invoices API to create the invoice
    // Note: This would need a service token or internal API call
    // For now, we'll just log it
    console.log('[Finance API] Auto-creating invoice from order:', invoiceData);

    return NextResponse.json({
      success: true,
      message: 'Invoice creation queued',
      invoice: invoiceData,
    });
  } catch (error) {
    console.error('[Finance API] Error auto-creating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

