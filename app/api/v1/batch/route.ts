/**
 * Request Batching API
 * 
 * Allows clients to batch multiple API requests into a single HTTP request.
 * This reduces network overhead and improves performance for dashboards
 * and complex pages that need data from multiple endpoints.
 * 
 * POST /api/v1/batch
 * 
 * Request body:
 * {
 *   "requests": [
 *     { "path": "/crm/contacts", "method": "GET", "params": {...} },
 *     { "path": "/crm/deals", "method": "GET", "params": {...} },
 *     { "path": "/finance/invoices", "method": "GET", "params": {...} }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "results": [
 *     { "status": 200, "data": {...} },
 *     { "status": 200, "data": {...} },
 *     { "status": 200, "data": {...} }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'

interface BatchRequest {
  path: string
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  params?: Record<string, any>
  body?: any
  headers?: Record<string, string>
}

interface BatchResponse {
  status: number
  data?: any
  error?: string
}

/**
 * Route handler for batch requests
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    // Get token from request headers
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''

    // Parse batch request
    const body = await request.json()
    const { requests } = body as { requests: BatchRequest[] }

    if (!requests || !Array.isArray(requests)) {
      return NextResponse.json(
        { error: 'Invalid request format. Expected "requests" array.' },
        { status: 400 }
      )
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 20
    if (requests.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} requests.` },
        { status: 400 }
      )
    }

    // Execute all requests in parallel
    const results = await Promise.allSettled(
      requests.map(async (req: BatchRequest) => {
        try {
          return await executeBatchRequest(req, tenantId, userId, token)
        } catch (error: any) {
          return {
            status: 500,
            error: error.message || 'Internal server error',
          } as BatchResponse
        }
      })
    )

    // Format results
    const formattedResults: BatchResponse[] = results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          status: 500,
          error: result.reason?.message || 'Request failed',
        }
      }
    })

    return NextResponse.json({
      results: formattedResults,
      count: formattedResults.length,
      success: formattedResults.every((r) => r.status < 400),
    })
  } catch (error: any) {
    console.error('Batch request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process batch request' },
      { status: error.status || 500 }
    )
  }
}

/**
 * Execute a single batch request
 */
async function executeBatchRequest(
  req: BatchRequest,
  tenantId: string,
  userId: string,
  token: string
): Promise<BatchResponse> {
  const { path, method = 'GET', params, body: requestBody, headers = {} } = req

  // Validate path (prevent SSRF attacks)
  if (!path.startsWith('/api/v1/') && !path.startsWith('/api/')) {
    // Allow relative paths, but normalize them
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    
    // Only allow API paths
    if (!normalizedPath.startsWith('/api/')) {
      throw new Error(`Invalid path: ${path}. Only API paths are allowed.`)
    }
  }

  // Build full URL (internal request)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const fullPath = path.startsWith('/api/') ? path : `/api${path}`
  const url = new URL(fullPath, baseUrl)

  // Add query parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  // Make internal request
  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': tenantId,
      'X-User-Id': userId,
      ...headers,
    },
    body: requestBody ? JSON.stringify(requestBody) : undefined,
  })

  // Parse response
  let data: any
  const contentType = response.headers.get('content-type')
  
  if (contentType?.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  return {
    status: response.status,
    data: response.ok ? data : undefined,
    error: response.ok ? undefined : (data?.error || data?.message || 'Request failed'),
  }
}

/**
 * GET handler - return batch API documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'Batch API',
    version: '1.0',
    description: 'Execute multiple API requests in a single HTTP call',
    usage: {
      method: 'POST',
      endpoint: '/api/v1/batch',
      body: {
        requests: [
          {
            path: '/api/v1/crm/contacts',
            method: 'GET',
            params: { page: 1, limit: 50 },
          },
          {
            path: '/api/v1/crm/deals',
            method: 'GET',
            params: { stage: 'open' },
          },
        ],
      },
    },
    limits: {
      maxBatchSize: 20,
      timeout: 30000, // 30 seconds
    },
    examples: {
      dashboard: {
        requests: [
          { path: '/api/v1/crm/contacts', method: 'GET', params: { limit: 10 } },
          { path: '/api/v1/crm/deals', method: 'GET', params: { limit: 10 } },
          { path: '/api/v1/finance/invoices', method: 'GET', params: { limit: 10 } },
          { path: '/api/dashboard/stats', method: 'GET' },
        ],
      },
    },
  })
}
