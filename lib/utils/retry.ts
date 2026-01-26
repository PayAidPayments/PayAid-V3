/**
 * Retry Utility
 * Zero-cost enhancement for resilience
 */

export interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: 'linear' | 'exponential'
  onRetry?: (attempt: number, error: Error) => void
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
  onRetry: () => {},
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < opts.maxAttempts) {
        const delay = calculateDelay(attempt, opts.delay, opts.backoff)
        opts.onRetry(attempt, lastError)
        await sleep(delay)
      }
    }
  }

  throw lastError || new Error('Retry failed')
}

function calculateDelay(attempt: number, baseDelay: number, backoff: string): number {
  if (backoff === 'exponential') {
    return baseDelay * Math.pow(2, attempt - 1)
  }
  return baseDelay * attempt
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
