/**
 * API Testing Endpoint
 * POST /api/test - Run API endpoint tests
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiTester } from '@/lib/api/test-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const organizationId = body.organizationId || request.headers.get('x-tenant-id')

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ORGANIZATION_ID',
            message: 'organizationId is required',
          },
        },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'

    const tester = new ApiTester(baseUrl, organizationId)
    const results = await tester.testAllEndpoints()
    const summary = tester.getSummary()

    return NextResponse.json({
      success: true,
      summary,
      results,
    })
  } catch (error) {
    console.error('API test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    )
  }
}
