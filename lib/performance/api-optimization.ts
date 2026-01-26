import { NextResponse } from 'next/server'

/**
 * API response optimization utilities
 */

/**
 * Compress response data
 */
export function compressResponse(data: any): any {
  // Remove null/undefined values
  if (Array.isArray(data)) {
    return data.map(compressResponse)
  }

  if (data && typeof data === 'object') {
    const compressed: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        compressed[key] = compressResponse(value)
      }
    }
    return compressed
  }

  return data
}

/**
 * Paginate response
 */
export function paginateResponse<T>(
  data: T[],
  page: number = 1,
  pageSize: number = 50
): {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
} {
  const total = data.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    data: data.slice(start, end),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * Create optimized API response
 */
export function createOptimizedResponse(
  data: any,
  options?: {
    compress?: boolean
    paginate?: { page: number; pageSize: number }
  }
): NextResponse {
  let responseData = data

  // Compress if requested
  if (options?.compress) {
    responseData = compressResponse(responseData)
  }

  // Paginate if requested
  if (options?.paginate && Array.isArray(data)) {
    responseData = paginateResponse(
      data,
      options.paginate.page,
      options.paginate.pageSize
    )
  }

  return NextResponse.json(
    {
      success: true,
      data: responseData,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Content-Type-Options': 'nosniff',
      },
    }
  )
}

/**
 * Measure API response time
 */
export async function measureResponseTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now()
  const result = await fn()
  const duration = Date.now() - start

  return { result, duration }
}
