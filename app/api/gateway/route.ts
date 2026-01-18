/**
 * API Gateway - Production-Ready Central Hub for Inter-Module Communication
 * 
 * Features:
 * - Redis-based rate limiting (distributed)
 * - Request/response monitoring
 * - Centralized authentication/authorization
 * - Module routing and proxying
 * - Error handling and logging
 * 
 * In production, this routes requests to separate module subdomains.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { enforceRateLimit, getClientIP } from '@/lib/middleware/rate-limit-redis'
import { trackAPICall } from '@/lib/monitoring/metrics'

// GET /api/gateway - Get available modules and their endpoints
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Module endpoints configuration
    const modules = {
      crm: {
        url: process.env.CRM_MODULE_URL || 'http://localhost:3000',
        endpoints: ['/api/crm/contacts', '/api/crm/deals', '/api/crm/leads'],
      },
      sales: {
        url: process.env.SALES_MODULE_URL || 'http://localhost:3001',
        endpoints: ['/api/sales/orders', '/api/sales/landing-pages', '/api/sales/checkout-pages'],
      },
      finance: {
        url: process.env.FINANCE_MODULE_URL || 'http://localhost:3002',
        endpoints: ['/api/finance/invoices', '/api/finance/accounting', '/api/finance/gst'],
      },
      marketing: {
        url: process.env.MARKETING_MODULE_URL || 'http://localhost:3003',
        endpoints: ['/api/marketing/campaigns', '/api/marketing/email', '/api/marketing/social'],
      },
      hr: {
        url: process.env.HR_MODULE_URL || 'http://localhost:3004',
        endpoints: ['/api/hr/employees', '/api/hr/payroll', '/api/hr/attendance'],
      },
      projects: {
        url: process.env.PROJECTS_MODULE_URL || 'http://localhost:3005',
        endpoints: ['/api/projects', '/api/projects/tasks', '/api/projects/time-tracking'],
      },
      inventory: {
        url: process.env.INVENTORY_MODULE_URL || 'http://localhost:3006',
        endpoints: ['/api/inventory/products', '/api/inventory/stock', '/api/inventory/warehouses'],
      },
    }

    return NextResponse.json({
      gateway: {
        version: '1.0',
        modules,
      },
    })
  } catch (error: any) {
    console.error('API Gateway error:', error)
    return NextResponse.json(
      { error: 'Failed to get gateway configuration' },
      { status: 500 }
    )
  }
}

/**
 * Get tenant tier from subscription (defaults to 'free')
 * In production, fetch from database or cache
 */
async function getTenantTier(tenantId: string): Promise<'free' | 'basic' | 'pro' | 'enterprise'> {
  // TODO: Fetch from database or cache
  // For now, default to 'free'
  return 'free'
}

/**
 * Proxy request to another module
 * POST /api/gateway/proxy
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let status = 200
  
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    // Get token from request headers
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    
    // Get tenant tier for rate limiting
    const tier = await getTenantTier(tenantId)
    
    // Enforce rate limiting (Redis-based)
    const rateLimitCheck = await enforceRateLimit(request, tenantId, userId, tier)
    if (!rateLimitCheck.allowed && rateLimitCheck.response) {
      status = 429
      trackAPICall('gateway.proxy', Date.now() - startTime, status)
      return rateLimitCheck.response
    }

    const body = await request.json()
    const { module, endpoint, method = 'GET', data } = body

    if (!module || !endpoint) {
      return NextResponse.json(
        { error: 'Module and endpoint required' },
        { status: 400 }
      )
    }

    // Get module URL
    const moduleUrls: Record<string, string> = {
      crm: process.env.CRM_MODULE_URL || 'http://localhost:3000',
      sales: process.env.SALES_MODULE_URL || 'http://localhost:3001',
      finance: process.env.FINANCE_MODULE_URL || 'http://localhost:3002',
      marketing: process.env.MARKETING_MODULE_URL || 'http://localhost:3003',
      hr: process.env.HR_MODULE_URL || 'http://localhost:3004',
      projects: process.env.PROJECTS_MODULE_URL || 'http://localhost:3005',
      inventory: process.env.INVENTORY_MODULE_URL || 'http://localhost:3006',
    }

    const moduleUrl = moduleUrls[module]
    if (!moduleUrl) {
      return NextResponse.json(
        { error: 'Invalid module' },
        { status: 400 }
      )
    }

    // For now, proxy to same server (monolithic)
    // In production, this will forward to separate module subdomains
    const targetUrl = `${moduleUrl}${endpoint}`

    // Forward request to target module
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    const responseData = await response.json()
    status = response.status

    // Track API call metrics
    trackAPICall('gateway.proxy', Date.now() - startTime, status)

    // Add monitoring headers
    return NextResponse.json(responseData, { 
      status: response.status,
      headers: {
        'X-Gateway-Version': '1.0',
        'X-Response-Time': String(Date.now() - startTime),
        'X-Module': body.module || 'unknown',
      },
    })
  } catch (error: any) {
    status = error.status || 500
    const duration = Date.now() - startTime
    
    console.error('API Gateway proxy error:', error)
    
    // Track error
    trackAPICall('gateway.proxy', duration, status)
    
    return NextResponse.json(
      { 
        error: 'Failed to proxy request',
        message: error.message || 'Internal server error',
      },
      { 
        status,
        headers: {
          'X-Gateway-Version': '1.0',
          'X-Response-Time': String(duration),
        },
      }
    )
  }
}

