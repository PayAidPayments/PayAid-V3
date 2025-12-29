/**
 * Environment Variable Utilities
 * Normalizes environment variables to handle trailing whitespace/newlines
 */

/**
 * Get and normalize an environment variable
 * Trims whitespace and newlines to prevent issues
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key]
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue.trim()
    }
    return ''
  }
  return value.trim()
}

/**
 * Get NODE_ENV with normalization
 * Ensures no trailing whitespace that causes Next.js warnings
 */
export function getNodeEnv(): 'production' | 'development' | 'test' {
  const env = getEnv('NODE_ENV', 'development')
  const normalized = env.toLowerCase().trim()
  
  if (normalized === 'production' || normalized === 'prod') {
    return 'production'
  }
  if (normalized === 'test') {
    return 'test'
  }
  return 'development'
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return getNodeEnv() === 'production'
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  return getNodeEnv() === 'development'
}

/**
 * Check if we're in test
 */
export function isTest(): boolean {
  return getNodeEnv() === 'test'
}

