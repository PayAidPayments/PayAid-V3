/**
 * Natural Language Query Parser
 * Maps natural language queries to API endpoints and data extraction
 * FREE implementation using existing Ollama/Groq
 */

export interface NLQueryResult {
  type: 'analytics' | 'data' | 'action' | 'general'
  endpoint?: string
  params?: Record<string, any>
  data?: any
  formattedResponse?: string
}

/**
 * Parse natural language query and determine what data/action is needed
 */
export function parseNLQuery(query: string): NLQueryResult {
  const lowerQuery = query.toLowerCase().trim()

  // Customer Segments Queries
  if (
    lowerQuery.includes('customer segment') ||
    lowerQuery.includes('top') && lowerQuery.includes('segment') ||
    lowerQuery.includes('show') && lowerQuery.includes('segment')
  ) {
    const topMatch = lowerQuery.match(/top\s+(\d+)/)
    const limit = topMatch ? parseInt(topMatch[1]) : 3

    return {
      type: 'analytics',
      endpoint: '/api/analytics/advanced/customers',
      params: { limit },
      formattedResponse: `Fetching your top ${limit} customer segments...`,
    }
  }

  // Revenue Queries
  if (
    lowerQuery.includes('revenue') ||
    lowerQuery.includes('sales') && lowerQuery.includes('total') ||
    lowerQuery.includes('income')
  ) {
    return {
      type: 'analytics',
      endpoint: '/api/analytics/revenue',
      params: {},
      formattedResponse: 'Fetching revenue data...',
    }
  }

  // Churn Risk Queries
  if (
    lowerQuery.includes('churn') ||
    lowerQuery.includes('at risk') ||
    lowerQuery.includes('customers leaving')
  ) {
    return {
      type: 'analytics',
      endpoint: '/api/analytics/advanced/customers',
      params: { filter: 'atRisk' },
      formattedResponse: 'Identifying customers at risk of churning...',
    }
  }

  // Top Customers Queries
  if (
    lowerQuery.includes('top customer') ||
    lowerQuery.includes('best customer') ||
    lowerQuery.includes('vip customer')
  ) {
    const topMatch = lowerQuery.match(/top\s+(\d+)/)
    const limit = topMatch ? parseInt(topMatch[1]) : 10

    return {
      type: 'analytics',
      endpoint: '/api/analytics/advanced/customers',
      params: { limit, sortBy: 'ltv' },
      formattedResponse: `Fetching your top ${limit} customers...`,
    }
  }

  // Pending Invoices
  if (
    lowerQuery.includes('pending invoice') ||
    lowerQuery.includes('unpaid invoice') ||
    lowerQuery.includes('overdue')
  ) {
    return {
      type: 'data',
      endpoint: '/api/invoices',
      params: { status: 'pending' },
      formattedResponse: 'Fetching pending invoices...',
    }
  }

  // Active Deals
  if (
    lowerQuery.includes('active deal') ||
    lowerQuery.includes('pipeline') ||
    lowerQuery.includes('opportunities')
  ) {
    return {
      type: 'data',
      endpoint: '/api/deals',
      params: { status: 'active' },
      formattedResponse: 'Fetching active deals...',
    }
  }

  // Pending Tasks
  if (
    lowerQuery.includes('pending task') ||
    lowerQuery.includes('todo') ||
    lowerQuery.includes('task due')
  ) {
    return {
      type: 'data',
      endpoint: '/api/tasks',
      params: { status: 'pending' },
      formattedResponse: 'Fetching pending tasks...',
    }
  }

  // Growth Opportunities
  if (
    lowerQuery.includes('growth') ||
    lowerQuery.includes('opportunity') ||
    lowerQuery.includes('potential')
  ) {
    return {
      type: 'analytics',
      endpoint: '/api/ai/insights',
      params: {},
      formattedResponse: 'Analyzing growth opportunities...',
    }
  }

  // Default: General query (let AI handle it)
  return {
    type: 'general',
    formattedResponse: 'Processing your query...',
  }
}

/**
 * Execute NL query by calling appropriate API and formatting response
 */
export async function executeNLQuery(
  query: string,
  tenantId: string,
  baseUrl: string = ''
): Promise<{ data: any; formattedResponse: string }> {
  const parsed = parseNLQuery(query)

  if (parsed.type === 'general') {
    return {
      data: null,
      formattedResponse: parsed.formattedResponse || 'I understand your query. Let me help you with that.',
    }
  }

  try {
    // Build API URL
    const url = parsed.endpoint
      ? `${baseUrl}${parsed.endpoint}${Object.keys(parsed.params || {}).length > 0 ? '?' + new URLSearchParams(parsed.params as any).toString() : ''}`
      : null

    if (!url) {
      return {
        data: null,
        formattedResponse: parsed.formattedResponse || 'Unable to process this query.',
      }
    }

    // For now, return the query structure
    // In production, you'd make the actual API call here
    return {
      data: {
        endpoint: parsed.endpoint,
        params: parsed.params,
      },
      formattedResponse: parsed.formattedResponse || 'Query processed successfully.',
    }
  } catch (error) {
    console.error('[NL_QUERY] Error executing query:', error)
    return {
      data: null,
      formattedResponse: 'I encountered an error processing your query. Please try rephrasing it.',
    }
  }
}

/**
 * Format analytics data into natural language response
 */
export function formatAnalyticsResponse(data: any, query: string): string {
  const lowerQuery = query.toLowerCase()

  // Customer Segments
  if (data.segments) {
    const segments = data.segments
    const topSegments = Object.entries(segments)
      .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([name, count]: [string, any]) => `${name}: ${count} customers`)

    return `Here are your top customer segments:\n${topSegments.join('\n')}`
  }

  // Top Customers
  if (data.topCustomersByLTV) {
    const customers = data.topCustomersByLTV.slice(0, 5)
    return `Your top customers by lifetime value:\n${customers.map((c: any, i: number) => `${i + 1}. ${c.name}: ₹${c.ltv.toLocaleString('en-IN')}`).join('\n')}`
  }

  // Churn Risk
  if (data.churnRate !== undefined) {
    return `Your current churn rate is ${data.churnRate.toFixed(1)}%. You have ${data.churnedCustomers} churned customers out of ${data.totalCustomers} total.`
  }

  return JSON.stringify(data, null, 2)
}
