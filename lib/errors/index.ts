/**
 * Standard Error Handling for PayAid V3
 * Provides consistent error response format across all API endpoints
 */

import { NextResponse } from 'next/server'

/**
 * Standard error codes for PayAid V3
 */
export enum ErrorCode {
  // Authentication & Authorization (1000-1999)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation Errors (2000-2999)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource Errors (3000-3999)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  
  // Business Logic Errors (4000-4999)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // External Service Errors (5000-5999)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  SMS_SERVICE_ERROR = 'SMS_SERVICE_ERROR',
  
  // Rate Limiting (6000-6999)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server Errors (9000-9999)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp?: string
    requestId?: string
  }
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: any

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * HTTP status code mapping for error codes
 */
const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  // Authentication & Authorization
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  
  // Validation Errors
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  
  // Resource Errors
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.RESOURCE_LOCKED]: 423,
  
  // Business Logic Errors
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 422,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.QUOTA_EXCEEDED]: 429,
  
  // External Service Errors
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.PAYMENT_GATEWAY_ERROR]: 502,
  [ErrorCode.EMAIL_SERVICE_ERROR]: 502,
  [ErrorCode.SMS_SERVICE_ERROR]: 502,
  
  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  
  // Server Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
}

/**
 * Create a standard error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any,
  requestId?: string
): NextResponse<ErrorResponse> {
  const statusCode = ERROR_STATUS_MAP[code] || 500

  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
    { status: statusCode }
  )
}

/**
 * Handle errors and return standard error response
 */
export function handleError(
  error: unknown,
  requestId?: string
): NextResponse<ErrorResponse> {
  // Handle AppError instances
  if (error instanceof AppError) {
    return createErrorResponse(
      error.code,
      error.message,
      error.details,
      requestId
    )
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      { issues: (error as any).issues },
      requestId
    )
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any
    if (prismaError.code === 'P2002') {
      return createErrorResponse(
        ErrorCode.ALREADY_EXISTS,
        'A record with this value already exists',
        { field: prismaError.meta?.target },
        requestId
      )
    }
    if (prismaError.code === 'P2025') {
      return createErrorResponse(
        ErrorCode.NOT_FOUND,
        'Record not found',
        undefined,
        requestId
      )
    }
    return createErrorResponse(
      ErrorCode.DATABASE_ERROR,
      'Database operation failed',
      { code: prismaError.code },
      requestId
    )
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const message =
      process.env.NODE_ENV === 'production'
        ? 'An internal error occurred'
        : error.message

    return createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      message,
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
      requestId
    )
  }

  // Handle unknown errors
  return createErrorResponse(
    ErrorCode.INTERNAL_SERVER_ERROR,
    'An unexpected error occurred',
    undefined,
    requestId
  )
}

/**
 * Generate a request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Success response helper (for consistency)
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  meta?: Record<string, any>
): NextResponse<{ data: T; meta?: Record<string, any> }> {
  return NextResponse.json(
    {
      data,
      ...(meta && { meta }),
    },
    { status: statusCode }
  )
}
