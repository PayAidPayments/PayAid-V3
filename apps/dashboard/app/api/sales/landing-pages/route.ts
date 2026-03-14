import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/packages/auth-sdk/client';

/**
 * Sales Module - Landing Pages API
 * Wrapper around existing /api/landing-pages with API Gateway integration
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward to existing landing pages API
    const searchParams = request.nextUrl.searchParams;
    const response = await fetch(`${API_BASE_URL}/api/landing-pages?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Sales API] Error fetching landing pages:', error);
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

    // Forward to existing landing pages API
    const response = await fetch(`${API_BASE_URL}/api/landing-pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Publish event to API Gateway
    if (response.ok && data.id) {
      try {
        await fetch(`${API_BASE_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'landing-page.created',
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
    console.error('[Sales API] Error creating landing page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

