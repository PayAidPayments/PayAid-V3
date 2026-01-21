/**
 * API Endpoint Testing Utilities
 * Helper functions for testing API endpoints
 */

import { formatINR } from '@/lib/currency'

export interface ApiTestResult {
  endpoint: string
  method: string
  status: 'success' | 'error'
  statusCode?: number
  responseTime: number
  error?: string
  data?: unknown
}

export class ApiTester {
  private baseUrl: string
  private organizationId: string
  private results: ApiTestResult[] = []

  constructor(baseUrl: string = '', organizationId: string = '') {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
    this.organizationId = organizationId
  }

  async testEndpoint(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<ApiTestResult> {
    const startTime = Date.now()
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.organizationId && { 'x-tenant-id': this.organizationId }),
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const responseTime = Date.now() - startTime
      const data = await response.json()

      const result: ApiTestResult = {
        endpoint,
        method,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        responseTime,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.error?.message || `HTTP ${response.status}`,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const responseTime = Date.now() - startTime
      const result: ApiTestResult = {
        endpoint,
        method,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.results.push(result)
      return result
    }
  }

  async testCRMEndpoints(): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = []

    // Test contacts endpoints
    results.push(await this.testEndpoint(`/api/crm/contacts?organizationId=${this.organizationId}`, 'GET'))
    
    // Test segments endpoint
    results.push(await this.testEndpoint(`/api/crm/segments?organizationId=${this.organizationId}`, 'GET'))
    
    // Test pipelines endpoint
    results.push(await this.testEndpoint(`/api/crm/pipelines?organizationId=${this.organizationId}`, 'GET'))
    
    // Test analytics endpoint
    results.push(await this.testEndpoint(`/api/crm/analytics/summary?organizationId=${this.organizationId}`, 'GET'))

    return results
  }

  async testFinanceEndpoints(): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = []

    // Test invoices endpoint
    results.push(await this.testEndpoint(`/api/finance/invoices?organizationId=${this.organizationId}`, 'GET'))
    
    // Test expenses endpoint
    results.push(await this.testEndpoint(`/api/finance/expenses?organizationId=${this.organizationId}`, 'GET'))
    
    // Test GST returns endpoint
    results.push(await this.testEndpoint(`/api/finance/gst-returns?organizationId=${this.organizationId}&period=monthly`, 'GET'))

    return results
  }

  async testMarketingEndpoints(): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = []

    // Test email campaigns endpoint
    results.push(await this.testEndpoint(`/api/marketing/email-campaigns?organizationId=${this.organizationId}`, 'GET'))
    
    // Test SMS campaigns endpoint
    results.push(await this.testEndpoint(`/api/marketing/sms-campaigns?organizationId=${this.organizationId}`, 'GET'))
    
    // Test AI content endpoint
    results.push(await this.testEndpoint(`/api/marketing/ai-content?organizationId=${this.organizationId}`, 'GET'))

    return results
  }

  async testProductivityEndpoints(): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = []

    // Test tasks endpoint
    results.push(await this.testEndpoint(`/api/productivity/tasks?organizationId=${this.organizationId}`, 'GET'))
    
    // Test projects endpoint
    results.push(await this.testEndpoint(`/api/productivity/projects?organizationId=${this.organizationId}`, 'GET'))

    return results
  }

  async testFreelancerEndpoints(): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = []

    // Test portfolio endpoint
    results.push(await this.testEndpoint(`/api/industries/freelancer/portfolio?organizationId=${this.organizationId}`, 'GET'))
    
    // Test proposals endpoint
    results.push(await this.testEndpoint(`/api/industries/freelancer/proposals?organizationId=${this.organizationId}`, 'GET'))

    return results
  }

  async testAllEndpoints(): Promise<ApiTestResult[]> {
    const allResults: ApiTestResult[] = []

    allResults.push(...(await this.testCRMEndpoints()))
    allResults.push(...(await this.testFinanceEndpoints()))
    allResults.push(...(await this.testMarketingEndpoints()))
    allResults.push(...(await this.testProductivityEndpoints()))
    allResults.push(...(await this.testFreelancerEndpoints()))

    return allResults
  }

  getResults(): ApiTestResult[] {
    return this.results
  }

  getSummary(): {
    total: number
    success: number
    errors: number
    averageResponseTime: number
  } {
    const total = this.results.length
    const success = this.results.filter((r) => r.status === 'success').length
    const errors = total - success
    const averageResponseTime =
      this.results.reduce((sum, r) => sum + r.responseTime, 0) / total || 0

    return {
      total,
      success,
      errors,
      averageResponseTime: Math.round(averageResponseTime),
    }
  }

  printSummary(): void {
    const summary = this.getSummary()
    console.log('=== API Test Summary ===')
    console.log(`Total Tests: ${summary.total}`)
    console.log(`Successful: ${summary.success}`)
    console.log(`Errors: ${summary.errors}`)
    console.log(`Average Response Time: ${summary.averageResponseTime}ms`)
    console.log('========================')
  }
}

// Export convenience function
export async function testApiEndpoints(organizationId: string): Promise<ApiTestResult[]> {
  const tester = new ApiTester('', organizationId)
  return tester.testAllEndpoints()
}
