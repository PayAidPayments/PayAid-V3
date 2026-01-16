import { NextRequest, NextResponse } from 'next/server'
import { getSessionToken } from '@/packages/auth-sdk/client'

/**
 * API Gateway - Deals API
 * Allows Finance module to access Deals from CRM module
 * This is the inter-module communication layer for decoupled architecture
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// GET /api/gateway/deals - Get deals (for Finance module access)
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Forward to CRM module's deals API
    const searchParams = request.nextUrl.searchParams
    const response = await fetch(`${API_BASE_URL}/api/crm/deals?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[API Gateway] Error fetching deals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/gateway/deals - Create deal (for Finance module access)
export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Forward to CRM module's deals API
    const response = await fetch(`${API_BASE_URL}/api/crm/deals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    // Publish event to API Gateway for cross-module sync
    if (response.ok && data.deal?.id) {
      try {
        await fetch(`${API_BASE_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'deal.created',
            data: data.deal,
            module: 'crm',
          }),
        })
      } catch (error) {
        console.error('[API Gateway] Error publishing event:', error)
        // Don't fail the request if event publishing fails
      }
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[API Gateway] Error creating deal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/gateway/deals/[id] - Update deal (for Finance module to mark as invoiced)
export async function PATCH(request: NextRequest) {
  try {
    const token = await getSessionToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const url = new URL(request.url)
    const dealId = url.pathname.split('/').pop()

    if (!dealId) {
      return NextResponse.json({ error: 'Deal ID required' }, { status: 400 })
    }

    // Forward to CRM module's deals API
    const response = await fetch(`${API_BASE_URL}/api/crm/deals/${dealId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    // Publish event to API Gateway for cross-module sync
    if (response.ok && data.deal?.id) {
      try {
        await fetch(`${API_BASE_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'deal.updated',
            data: data.deal,
            module: 'crm',
          }),
        })
      } catch (error) {
        console.error('[API Gateway] Error publishing event:', error)
        // Don't fail the request if event publishing fails
      }
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[API Gateway] Error updating deal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

