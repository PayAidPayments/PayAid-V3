/**
 * API Route Wrapper for Standard Error Handling
 * Use this wrapper to ensure consistent error responses across all endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleError, generateRequestId, createSuccessResponse, ErrorCode, AppError } from '@/lib/errors'

/**
 * Wrapper function for API route handlers
 * Automatically handles errors and returns standard error responses
 */
export function withErrorHandling<T = unknown>(
  handler: (request: NextRequest, context?: { params?: Promise<Record<string, string>> }) => Promise<NextResponse<T | { success: boolean; statusCode: number; error: { code: string; message: string } }>>
) {
  return async (request: NextRequest, context?: { params?: Promise<Record<string, string>> }): Promise<NextResponse> => {
    // Ensure context.params exists for route handlers that need it
    const handlerContext = context || { params: Promise.resolve({}) as Promise<Record<string, string>> }
    const requestId = generateRequestId()

    try {
      const response = await handler(request, context)
      return response
    } catch (error) {
      return handleError(error, requestId)
    }
  }
}

/**
 * Helper to create success response
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  meta?: Record<string, any>
): NextResponse {
  return createSuccessResponse(data, statusCode, meta)
}

/**
 * Helper to create error response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: any,
  statusCode?: number
): NextResponse {
  const { createErrorResponse } = require('@/lib/errors')
  return createErrorResponse(code, message, details, generateRequestId())
}

/**
 * Helper to throw AppError
 */
export function throwError(
  code: ErrorCode,
  message: string,
  statusCode?: number,
  details?: any
): never {
  throw new AppError(code, message, statusCode, details)
}

/**
 * Example usage in an API route:
 * 
 * import { withErrorHandling, successResponse, throwError, ErrorCode } from '@/lib/api/route-wrapper'
 * 
 * export const GET = withErrorHandling(async (request: NextRequest) => {
 *   // Your handler logic
 *   const data = await fetchData()
 *   
 *   if (!data) {
 *     throwError(ErrorCode.NOT_FOUND, 'Resource not found', 404)
 *   }
 *   
 *   return successResponse(data)
 * })
 */
