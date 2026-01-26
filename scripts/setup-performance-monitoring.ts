/**
 * Performance Monitoring Setup Script
 * 
 * Sets up performance monitoring for Financial Dashboard
 * Run this after Steps 1-8 are completed
 * 
 * Usage:
 *   npx tsx scripts/setup-performance-monitoring.ts
 */

import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

interface MonitoringConfig {
  queryPerformance: {
    enabled: boolean
    slowQueryThreshold: number // milliseconds
    logSlowQueries: boolean
  }
  materializedViewRefresh: {
    enabled: boolean
    trackRefreshTimes: boolean
    alertThreshold: number // milliseconds
  }
  apiResponseTimes: {
    enabled: boolean
    trackEndpoints: string[]
    alertThreshold: number // milliseconds
  }
  databaseConnections: {
    enabled: boolean
    maxConnections: number
    alertThreshold: number // percentage
  }
  dashboardLoadTimes: {
    enabled: boolean
    alertThreshold: number // milliseconds
  }
  exportGeneration: {
    enabled: boolean
    trackPDF: boolean
    trackExcel: boolean
    alertThreshold: number // milliseconds
  }
  errorRate: {
    enabled: boolean
    alertThreshold: number // percentage
  }
}

const defaultConfig: MonitoringConfig = {
  queryPerformance: {
    enabled: true,
    slowQueryThreshold: 1000, // 1 second
    logSlowQueries: true,
  },
  materializedViewRefresh: {
    enabled: true,
    trackRefreshTimes: true,
    alertThreshold: 5000, // 5 seconds
  },
  apiResponseTimes: {
    enabled: true,
    trackEndpoints: [
      '/api/v1/financials/dashboard',
      '/api/v1/financials/p-and-l',
      '/api/v1/financials/cash-flow/daily',
      '/api/v1/financials/variance',
      '/api/v1/financials/alerts',
    ],
    alertThreshold: 2000, // 2 seconds
  },
  databaseConnections: {
    enabled: true,
    maxConnections: 100,
    alertThreshold: 80, // Alert at 80% usage
  },
  dashboardLoadTimes: {
    enabled: true,
    alertThreshold: 3000, // 3 seconds
  },
  exportGeneration: {
    enabled: true,
    trackPDF: true,
    trackExcel: true,
    alertThreshold: 10000, // 10 seconds
  },
  errorRate: {
    enabled: true,
    alertThreshold: 5, // 5% error rate
  },
}

async function createMonitoringTable() {
  console.log('📊 Creating performance monitoring table...')

  // Create a table to store performance metrics
  // This would be done via Prisma migration, but for now we'll create SQL
  const sql = `
    -- Performance Metrics Table
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id SERIAL PRIMARY KEY,
      metric_type VARCHAR(50) NOT NULL,
      metric_name VARCHAR(100) NOT NULL,
      value DECIMAL(15, 2) NOT NULL,
      unit VARCHAR(20) NOT NULL,
      tenant_id VARCHAR(255),
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_metric_type (metric_type),
      INDEX idx_created_at (created_at),
      INDEX idx_tenant_id (tenant_id)
    );

    -- Slow Query Log Table
    CREATE TABLE IF NOT EXISTS slow_query_log (
      id SERIAL PRIMARY KEY,
      query_text TEXT NOT NULL,
      execution_time_ms DECIMAL(10, 2) NOT NULL,
      tenant_id VARCHAR(255),
      endpoint VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_execution_time (execution_time_ms),
      INDEX idx_created_at (created_at)
    );

    -- API Response Time Log Table
    CREATE TABLE IF NOT EXISTS api_response_log (
      id SERIAL PRIMARY KEY,
      endpoint VARCHAR(255) NOT NULL,
      method VARCHAR(10) NOT NULL,
      response_time_ms DECIMAL(10, 2) NOT NULL,
      status_code INTEGER,
      tenant_id VARCHAR(255),
      error_message TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_endpoint (endpoint),
      INDEX idx_response_time (response_time_ms),
      INDEX idx_created_at (created_at)
    );
  `

  console.log('✅ Monitoring tables SQL generated')
  return sql
}

async function createMonitoringMiddleware() {
  console.log('🔧 Creating monitoring middleware...')

  const middlewareCode = `
/**
 * Performance Monitoring Middleware
 * 
 * Add this to your API routes to track performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const SLOW_QUERY_THRESHOLD = 1000 // 1 second
const SLOW_API_THRESHOLD = 2000 // 2 seconds

export async function withPerformanceMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>,
  endpoint: string
) {
  return async (req: NextRequest) => {
    const startTime = Date.now()
    let statusCode = 200
    let errorMessage: string | null = null

    try {
      const response = await handler(req)
      statusCode = response.status
      return response
    } catch (error) {
      statusCode = 500
      errorMessage = error instanceof Error ? error.message : String(error)
      throw error
    } finally {
      const responseTime = Date.now() - startTime
      const tenantId = req.headers.get('x-tenant-id') || null

      // Log API response time
      if (responseTime > SLOW_API_THRESHOLD) {
        console.warn(\`[PERF] Slow API: \${endpoint} - \${responseTime}ms\`)
      }

      // Store in database (async, non-blocking)
      prisma.apiResponseLog
        .create({
          data: {
            endpoint,
            method: req.method,
            responseTimeMs: responseTime,
            statusCode,
            tenantId,
            errorMessage,
          },
        })
        .catch((err) => {
          console.error('Failed to log API response:', err)
        })
    }
  }
}

/**
 * Query Performance Monitoring
 * Wraps Prisma queries to track slow queries
 */
export function withQueryMonitoring<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()

  return queryFn().then(
    (result) => {
      const executionTime = Date.now() - startTime

      if (executionTime > SLOW_QUERY_THRESHOLD) {
        console.warn(\`[PERF] Slow Query: \${queryName} - \${executionTime}ms\`)

        // Log to database (async, non-blocking)
        prisma.slowQueryLog
          .create({
            data: {
              queryText: queryName,
              executionTimeMs: executionTime,
            },
          })
          .catch((err) => {
            console.error('Failed to log slow query:', err)
          })
      }

      return result
    },
    (error) => {
      const executionTime = Date.now() - startTime
      console.error(\`[PERF] Query Error: \${queryName} - \${executionTime}ms\`, error)
      throw error
    }
  )
}
`

  const filePath = join(process.cwd(), 'lib/monitoring/performance-middleware.ts')
  writeFileSync(filePath, middlewareCode)
  console.log(`✅ Monitoring middleware created: ${filePath}`)
}

async function createMonitoringDashboard() {
  console.log('📈 Creating monitoring dashboard component...')

  const componentCode = `
/**
 * Performance Monitoring Dashboard Component
 * 
 * Displays performance metrics and alerts
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PerformanceMetrics {
  avgApiResponseTime: number
  slowQueriesCount: number
  errorRate: number
  dashboardLoadTime: number
}

export function PerformanceMonitoringDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/performance/metrics')
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch performance metrics:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div>Loading performance metrics...</div>
  }

  if (!metrics) {
    return <div>No performance metrics available</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Avg API Response</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.avgApiResponseTime}ms
          </div>
          {metrics.avgApiResponseTime > 2000 && (
            <div className="text-red-500 text-sm">⚠️ Slow</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slow Queries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.slowQueriesCount}</div>
          {metrics.slowQueriesCount > 10 && (
            <div className="text-yellow-500 text-sm">⚠️ High</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.errorRate}%</div>
          {metrics.errorRate > 5 && (
            <div className="text-red-500 text-sm">⚠️ High</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Load</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.dashboardLoadTime}ms</div>
          {metrics.dashboardLoadTime > 3000 && (
            <div className="text-yellow-500 text-sm">⚠️ Slow</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
`

  const filePath = join(process.cwd(), 'components/admin/PerformanceMonitoringDashboard.tsx')
  writeFileSync(filePath, componentCode)
  console.log(`✅ Monitoring dashboard component created: ${filePath}`)
}

async function main() {
  console.log('🚀 Setting up Performance Monitoring\n')

  try {
    // 1. Create monitoring tables SQL
    const sql = await createMonitoringTable()
    const sqlPath = join(process.cwd(), 'prisma/migrations/performance-monitoring-tables.sql')
    writeFileSync(sqlPath, sql)
    console.log(`✅ SQL file created: ${sqlPath}\n`)

    // 2. Create monitoring middleware
    await createMonitoringMiddleware()
    console.log()

    // 3. Create monitoring dashboard component
    await createMonitoringDashboard()
    console.log()

    // 4. Create config file
    const configPath = join(process.cwd(), 'config/performance-monitoring.json')
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
    console.log(`✅ Config file created: ${configPath}\n`)

    console.log('✅ Performance monitoring setup complete!')
    console.log('\n📋 Next Steps:')
    console.log('1. Apply SQL migration: npx prisma db execute --file prisma/migrations/performance-monitoring-tables.sql')
    console.log('2. Use monitoring middleware in API routes')
    console.log('3. Add PerformanceMonitoringDashboard to admin panel')
    console.log('4. Configure alerts based on thresholds')
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
