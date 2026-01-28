/**
 * Database Connection Retry Utility
 * 
 * Provides retry logic for database operations to handle transient connection failures
 * Includes circuit breaker pattern to prevent cascading failures
 */

import { circuitBreaker } from './circuit-breaker'

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  exponentialBackoff?: boolean
  retryableErrors?: string[]
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  exponentialBackoff: true,
  retryableErrors: [
    'P1001', // Connection timeout
    'P1002', // Pooler timeout
    'P1017', // Server closed connection
    'MaxClientsInSessionMode',
    'max clients reached',
    'connection',
    'timeout',
    'ECONNREFUSED',
    'ENOTFOUND',
  ],
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  const errorMessage = error?.message || String(error)
  const errorCode = error?.code || ''
  
  return retryableErrors.some(
    (pattern) =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
      errorCode.includes(pattern)
  )
}

/**
 * Execute a database operation with retry logic and circuit breaker
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Check circuit breaker first
  if (circuitBreaker.isOpen()) {
    const error = new Error('Database is temporarily unavailable. Please try again in a moment.')
    ;(error as any).code = 'CIRCUIT_OPEN'
    ;(error as any).isCircuitBreaker = true
    throw error
  }

  const config = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await operation()
      // Record success in circuit breaker
      circuitBreaker.recordSuccess()
      return result
    } catch (error: any) {
      lastError = error

      // Record failure in circuit breaker
      circuitBreaker.recordFailure()

      // Don't retry if circuit breaker is open
      if (circuitBreaker.isOpen()) {
        const circuitError = new Error('Database is temporarily unavailable. Please try again in a moment.')
        ;(circuitError as any).code = 'CIRCUIT_OPEN'
        ;(circuitError as any).isCircuitBreaker = true
        throw circuitError
      }

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error, config.retryableErrors)) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = config.exponentialBackoff
        ? config.retryDelay * Math.pow(2, attempt)
        : config.retryDelay

      console.warn(
        `Database operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${delay}ms...`,
        {
          error: error?.message,
          code: error?.code,
        }
      )

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Wrapper for Prisma operations with automatic retry
 */
export function prismaWithRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return withRetry(operation, options)
}

