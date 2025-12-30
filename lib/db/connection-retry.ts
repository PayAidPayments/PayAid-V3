/**
 * Database Connection Retry Utility
 * 
 * Provides retry logic for database operations to handle transient connection failures
 */

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
 * Execute a database operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let lastError: any

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error

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

