import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/packages/auth-sdk/client';

/**
 * Finance Module - GST Reports API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'gstr-1';
    
    let url = `${API_BASE_URL}/api/gst/gstr-1`;
    if (reportType === 'gstr-3b') {
      url = `${API_BASE_URL}/api/gst/gstr-3b`;
    }

    const response = await fetch(`${url}?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Finance API] Error fetching GST reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

