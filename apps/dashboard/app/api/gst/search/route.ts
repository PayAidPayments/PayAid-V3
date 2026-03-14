import { NextRequest, NextResponse } from 'next/server'
import { searchHSNCodes, getGSTRateByCode } from '@/lib/data/gst-rates'

/**
 * GET /api/gst/search?q=query&type=goods|services
 * Search HSN/SAC codes based on product name/description
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') as 'goods' | 'services' | null

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        results: [],
        message: 'Query must be at least 2 characters long'
      })
    }

    const results = searchHSNCodes(query, type || undefined)

    return NextResponse.json({
      results,
      count: results.length,
    })
  } catch (error) {
    console.error('GST search error:', error)
    return NextResponse.json(
      { error: 'Failed to search HSN/SAC codes' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/gst/rate?code=HSN_CODE
 * Get GST rate by HSN/SAC code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    const rate = getGSTRateByCode(code)

    if (!rate) {
      return NextResponse.json(
        { error: 'HSN/SAC code not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rate)
  } catch (error) {
    console.error('Get GST rate error:', error)
    return NextResponse.json(
      { error: 'Failed to get GST rate' },
      { status: 500 }
    )
  }
}
