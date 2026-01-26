/**
 * Load testing utilities and scripts
 */

export interface LoadTestConfig {
  contacts: number
  deals: number
  users: number
  concurrentRequests: number
}

export interface LoadTestResult {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerSecond: number
  errors: Array<{
    endpoint: string
    error: string
    count: number
  }>
}

/**
 * Generate test data for load testing
 */
export async function generateTestData(
  tenantId: string,
  config: LoadTestConfig
): Promise<void> {
  const { contacts, deals } = config

  // Generate contacts in batches
  const contactBatchSize = 100
  for (let i = 0; i < contacts; i += contactBatchSize) {
    const batch = Array.from({ length: Math.min(contactBatchSize, contacts - i) }, (_, j) => ({
      tenantId,
      name: `Test Contact ${i + j + 1}`,
      email: `test${i + j + 1}@example.com`,
      phone: `+91${Math.floor(Math.random() * 10000000000)}`,
      status: 'active',
    }))

    // Use batch insert (would need Prisma extension or raw SQL)
    // await prisma.contact.createMany({ data: batch })
  }

  // Generate deals in batches
  const dealBatchSize = 50
  for (let i = 0; i < deals; i += dealBatchSize) {
    const batch = Array.from({ length: Math.min(dealBatchSize, deals - i) }, (_, j) => ({
      tenantId,
      name: `Test Deal ${i + j + 1}`,
      value: Math.floor(Math.random() * 1000000),
      stage: ['lead', 'contacted', 'demo', 'proposal', 'negotiation'][
        Math.floor(Math.random() * 5)
      ],
      status: 'open',
    }))

    // Use batch insert
    // await prisma.deal.createMany({ data: batch })
  }
}

/**
 * Run automated load test (can be executed programmatically)
 */
export async function runLoadTest(
  baseUrl: string,
  config: LoadTestConfig
): Promise<LoadTestResult> {
  const results: Array<{ endpoint: string; duration: number; success: boolean; error?: string }> = []

  const endpoints = [
    '/api/crm/contacts',
    '/api/crm/deals',
    '/api/crm/dashboard/summary',
    '/api/crm/analytics/pipeline-health',
  ]

  // Simulate concurrent requests
  const promises = Array.from({ length: config.concurrentRequests }, async () => {
    for (const endpoint of endpoints) {
      const start = Date.now()
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          headers: {
            'Authorization': 'Bearer test-token',
            'X-Tenant-ID': 'test-tenant',
          },
        })
        const duration = Date.now() - start
        results.push({
          endpoint,
          duration,
          success: response.ok,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        })
      } catch (error) {
        const duration = Date.now() - start
        results.push({
          endpoint,
          duration,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  })

  await Promise.all(promises)

  // Calculate metrics
  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)
  const durations = results.map((r) => r.duration).sort((a, b) => a - b)

  const averageResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length
  const p95Index = Math.floor(durations.length * 0.95)
  const p99Index = Math.floor(durations.length * 0.99)

  // Group errors by endpoint
  const errorMap = new Map<string, number>()
  failed.forEach((r) => {
    const key = `${r.endpoint}:${r.error}`
    errorMap.set(key, (errorMap.get(key) || 0) + 1)
  })

  const errors = Array.from(errorMap.entries()).map(([key, count]) => {
    const [endpoint, error] = key.split(':')
    return { endpoint, error, count }
  })

  return {
    totalRequests: results.length,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    averageResponseTime,
    p95ResponseTime: durations[p95Index] || 0,
    p99ResponseTime: durations[p99Index] || 0,
    requestsPerSecond: results.length / (durations[durations.length - 1] / 1000),
    errors,
  }
}
