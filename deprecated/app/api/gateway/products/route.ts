import { NextRequest, NextResponse } from 'next/server'
import { getSessionToken } from '@/packages/auth-sdk/client'

/**
 * API Gateway - Products API
 * Allows Sales module to access Products from Inventory module
 * This is the inter-module communication layer for decoupled architecture
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// GET /api/gateway/products - Get products (for Sales module access)
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Forward to Inventory module's products API
    const searchParams = request.nextUrl.searchParams
    const response = await fetch(`${API_BASE_URL}/api/products?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[API Gateway] Error fetching products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/gateway/products - Create product (for Sales module access)
export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Forward to Inventory module's products API
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    // Publish event to API Gateway for cross-module sync
    if (response.ok && data.id) {
      try {
        await fetch(`${API_BASE_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'product.created',
            data: data,
            module: 'inventory',
          }),
        })
      } catch (error) {
        console.error('[API Gateway] Error publishing event:', error)
        // Don't fail the request if event publishing fails
      }
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[API Gateway] Error creating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

