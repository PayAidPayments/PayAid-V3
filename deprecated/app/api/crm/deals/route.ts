import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/packages/auth-sdk/client';

/**
 * CRM Module - Deals API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const response = await fetch(`${API_BASE_URL}/api/deals?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[CRM API] Error fetching deals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/deals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Publish event if deal is won
    if (response.ok && data.status === 'won') {
      try {
        await fetch(`${API_BASE_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'deal.won',
            data: data,
            module: 'crm',
          }),
        });
      } catch (error) {
        console.error('[CRM API] Error publishing event:', error);
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[CRM API] Error creating deal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

