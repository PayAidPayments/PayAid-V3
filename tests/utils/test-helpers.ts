/**
 * Test Helper Utilities
 * 
 * Common utilities for testing
 */

import { NextRequest } from 'next/server'

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options?: {
    method?: string
    headers?: Record<string, string>
    cookies?: Record<string, string>
    body?: any
  }
): NextRequest {
  const request = new NextRequest(url, {
    method: options?.method || 'GET',
    headers: options?.headers || {},
  })

  // Add cookies
  if (options?.cookies) {
    Object.entries(options.cookies).forEach(([name, value]) => {
      request.cookies.set(name, value)
    })
  }

  return request
}

/**
 * Create a mock authenticated request
 */
export function createAuthenticatedRequest(
  url: string,
  token: string,
  options?: {
    method?: string
    body?: any
  }
): NextRequest {
  return createMockRequest(url, {
    method: options?.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cookies: {
      payaid_token: token,
    },
    body: options?.body,
  })
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  throw new Error('Timeout waiting for condition')
}

/**
 * Generate test JWT token
 */
export function generateTestToken(payload: {
  userId: string
  tenantId: string
  email?: string
  licensedModules?: string[]
}): string {
  // This would use the actual JWT signing function
  // For now, return a mock token
  return `test_token_${JSON.stringify(payload)}`
}

/**
 * Mock fetch for testing
 */
export function createMockFetch(
  responses: Record<string, { status: number; body: any }>
): typeof fetch {
  return async (url: string | URL, options?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString()
    const response = responses[urlString]

    if (!response) {
      throw new Error(`No mock response for ${urlString}`)
    }

    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}

