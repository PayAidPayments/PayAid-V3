/**
 * Enhanced Input Validation Middleware
 * Zero-cost enhancement for safety and data integrity
 */

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { logger } from '@/lib/logging/structured-logger'

export interface ValidationConfig {
  body?: z.ZodSchema
  query?: z.ZodSchema
  params?: z.ZodSchema
  headers?: z.ZodSchema
}

/**
 * Validate request inputs
 */
export async function validateInput(
  request: NextRequest,
  config: ValidationConfig
): Promise<{ valid: boolean; errors?: Record<string, any>; data?: any }> {
  const errors: Record<string, any> = {}

  try {
    // Validate body
    if (config.body) {
      try {
        const body = await request.json()
        const validatedBody = config.body.parse(body)
        if (!errors.body) errors.body = validatedBody
      } catch (error) {
        if (error instanceof ZodError) {
          errors.body = error.errors
        } else {
          errors.body = [{ message: 'Invalid JSON body' }]
        }
      }
    }

    // Validate query parameters
    if (config.query) {
      try {
        const searchParams = Object.fromEntries(new URL(request.url).searchParams.entries())
        const validatedQuery = config.query.parse(searchParams)
        if (!errors.query) errors.query = validatedQuery
      } catch (error) {
        if (error instanceof ZodError) {
          errors.query = error.errors
        }
      }
    }

    // Validate headers
    if (config.headers) {
      try {
        const headers = Object.fromEntries(request.headers.entries())
        const validatedHeaders = config.headers.parse(headers)
        if (!errors.headers) errors.headers = validatedHeaders
      } catch (error) {
        if (error instanceof ZodError) {
          errors.headers = error.errors
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      logger.warn('Input validation failed', {
        path: new URL(request.url).pathname,
        errors,
      })
      return { valid: false, errors }
    }

    return {
      valid: true,
      data: {
        body: errors.body,
        query: errors.query,
        headers: errors.headers,
      },
    }
  } catch (error) {
    logger.error('Validation error', error instanceof Error ? error : undefined, {
      path: new URL(request.url).pathname,
    })
    return { valid: false, errors: { general: 'Validation failed' } }
  }
}

/**
 * Input validation middleware wrapper
 */
export function withValidation(config: ValidationConfig) {
  return async (request: NextRequest, handler: (data: any) => Promise<NextResponse>) => {
    const validation = await validateInput(request, config)

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    return handler(validation.data)
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  tenantId: z.string().min(1, 'Tenant ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  pagination: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    pageSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  }),
  dateRange: z.object({
    startDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
    endDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  }),
}
