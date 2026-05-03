/**
 * Setup monitoring and alerting configuration
 * This script generates configuration files for monitoring tools
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const monitoringConfig = {
  // Prometheus metrics endpoint
  prometheus: {
    enabled: true,
    port: 9090,
    path: '/metrics',
    scrapeInterval: '15s',
  },

  // Health check endpoints
  healthChecks: {
    database: {
      endpoint: '/api/health/database',
      interval: 30, // seconds
      timeout: 5, // seconds
    },
    redis: {
      endpoint: '/api/health/redis',
      interval: 30,
      timeout: 5,
    },
    api: {
      endpoint: '/api/health',
      interval: 10,
      timeout: 3,
    },
  },

  // Alert thresholds
  alerts: {
    apiResponseTime: {
      warning: 500, // ms
      critical: 1000, // ms
    },
    errorRate: {
      warning: 0.05, // 5%
      critical: 0.1, // 10%
    },
    databaseConnections: {
      warning: 80, // 80% of max
      critical: 90, // 90% of max
    },
  },

  // Logging
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: 'json',
    destinations: ['console', 'file'],
    file: {
      path: './logs/app.log',
      maxSize: '10MB',
      maxFiles: 5,
    },
  },
}

const errorTrackingConfig = {
  // Sentry configuration
  sentry: {
    enabled: process.env.SENTRY_DSN ? true : false,
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1, // 10% of transactions
    beforeSend: (event: any) => {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization']
        delete event.request.headers['x-api-key']
      }
      return event
    },
  },

  // Bugsnag configuration (alternative)
  bugsnag: {
    enabled: process.env.BUGSNAG_API_KEY ? true : false,
    apiKey: process.env.BUGSNAG_API_KEY || '',
    releaseStage: process.env.NODE_ENV || 'development',
  },
}

// Write configuration files
const configDir = join(process.cwd(), 'config')

// Create config directory if it doesn't exist
try {
  mkdirSync(configDir, { recursive: true })
} catch (error) {
  // Directory might already exist, ignore
}

try {
  writeFileSync(
    join(configDir, 'monitoring.json'),
    JSON.stringify(monitoringConfig, null, 2)
  )
  console.log('✅ Monitoring configuration created: config/monitoring.json')

  writeFileSync(
    join(configDir, 'error-tracking.json'),
    JSON.stringify(errorTrackingConfig, null, 2)
  )
  console.log('✅ Error tracking configuration created: config/error-tracking.json')

  console.log('\n📋 Next Steps:')
  console.log('1. Set environment variables:')
  console.log('   - SENTRY_DSN (optional, for Sentry)')
  console.log('   - BUGSNAG_API_KEY (optional, for Bugsnag)')
  console.log('2. Install monitoring tools:')
  console.log('   - npm install @sentry/nextjs (if using Sentry)')
  console.log('   - npm install @bugsnag/js (if using Bugsnag)')
  console.log('3. Initialize monitoring in your app:')
  console.log('   - See docs/MONITORING_SETUP.md for details')
} catch (error) {
  console.error('Error creating configuration files:', error)
  process.exit(1)
}
