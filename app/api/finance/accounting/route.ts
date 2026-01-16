import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/packages/auth-sdk/client';

/**
 * Finance Module - Accounting API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('report') || 'expenses';
    
    let url = `${API_BASE_URL}/api/accounting/expenses`;
    if (endpoint === 'pnl') {
      url = `${API_BASE_URL}/api/accounting/reports/pl`;
    } else if (endpoint === 'balance-sheet') {
      url = `${API_BASE_URL}/api/accounting/reports/balance-sheet`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Finance API] Error fetching accounting data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

