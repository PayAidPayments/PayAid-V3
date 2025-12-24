// Sentry error tracking setup
// This will be configured when SENTRY_DSN is available

export function initSentry() {
  if (process.env.SENTRY_DSN && typeof window !== 'undefined') {
    // Client-side Sentry initialization
    // Will be implemented when @sentry/nextjs is installed
    console.log('Sentry will be initialized with DSN:', process.env.SENTRY_DSN)
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: context })
    console.error('Exception captured:', error, context)
  } else {
    console.error('Exception:', error, context)
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.SENTRY_DSN) {
    // Sentry.captureMessage(message, level)
    console.log(`[${level.toUpperCase()}]`, message)
  } else {
    console.log(`[${level.toUpperCase()}]`, message)
  }
}

