import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/packages/auth-sdk/client';

/**
 * Sales Module - Checkout Page API (Single)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getSessionToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const response = await fetch(`${API_BASE_URL}/api/checkout-pages/${resolvedParams.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Sales API] Error fetching checkout page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getSessionToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/checkout-pages/${resolvedParams.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Publish event to API Gateway
    if (response.ok) {
      try {
        await fetch(`${API_BASE_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'checkout-page.updated',
            data: data,
            module: 'sales',
          }),
        });
      } catch (error) {
        console.error('[Sales API] Error publishing event:', error);
        // Don't fail the request if event publishing fails
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Sales API] Error updating checkout page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getSessionToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const response = await fetch(`${API_BASE_URL}/api/checkout-pages/${resolvedParams.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      // Publish event to API Gateway
      try {
        await fetch(`${API_BASE_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'checkout-page.deleted',
            data: { id: resolvedParams.id },
            module: 'sales',
          }),
        });
      } catch (error) {
        console.error('[Sales API] Error publishing event:', error);
      }
    }

    return NextResponse.json({ success: true }, { status: response.status });
  } catch (error) {
    console.error('[Sales API] Error deleting checkout page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

