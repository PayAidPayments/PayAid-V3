import { NextRequest, NextResponse } from 'next/server'
import { getSessionToken } from '@/packages/auth-sdk/client'

/**
 * API Gateway - Projects API
 * Allows other modules to access Projects from Projects module
 * This is the inter-module communication layer for decoupled architecture
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// GET /api/gateway/projects - Get projects (for other modules access)
export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Forward to Projects module's API
    const searchParams = request.nextUrl.searchParams
    const response = await fetch(`${API_BASE_URL}/api/projects?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[API Gateway] Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/gateway/projects - Create project (for other modules access)
export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Forward to Projects module's API
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
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
            event: 'project.created',
            data: data,
            module: 'projects',
          }),
        })
      } catch (error) {
        console.error('[API Gateway] Error publishing event:', error)
        // Don't fail the request if event publishing fails
      }
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[API Gateway] Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

