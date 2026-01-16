/**
 * GraphQL API Endpoint
 * 
 * POST /api/graphql
 * GraphQL endpoint for flexible querying
 */

import { NextRequest, NextResponse } from 'next/server'
import { graphql, GraphQLError } from 'graphql'
import { schema } from '@/lib/graphql/schema'
import { resolvers } from '@/lib/graphql/resolvers'
import { trackAPICall } from '@/lib/monitoring/metrics'
import { enforceRateLimit } from '@/lib/middleware/rate-limit-redis'

// Helper to extract tenant from JWT or headers
function getTenantFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    // Decode JWT to get tenantId (simplified - use your actual JWT verification)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.tenantId || null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitResult = await enforceRateLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          errors: [
            {
              message: 'Rate limit exceeded',
              extensions: { code: 'RATE_LIMIT_EXCEEDED' },
            },
          ],
        },
        { status: 429 }
      )
    }

    // Get request body
    const body = await request.json()
    const { query, variables, operationName } = body

    if (!query) {
      return NextResponse.json(
        {
          errors: [{ message: 'Query is required' }],
        },
        { status: 400 }
      )
    }

    // Get tenant from request
    const tenantId = getTenantFromRequest(request)
    if (!tenantId) {
      return NextResponse.json(
        {
          errors: [{ message: 'Unauthorized: tenantId required' }],
        },
        { status: 401 }
      )
    }

    // Execute GraphQL query
    const result = await graphql({
      schema,
      source: query,
      variableValues: variables,
      operationName,
      rootValue: resolvers,
      contextValue: { tenantId },
    })

    const duration = Date.now() - startTime

    // Track metrics
    trackAPICall('/api/graphql', duration, result.errors ? 500 : 200)

    // Return result
    return NextResponse.json(result, {
      status: result.errors ? 400 : 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    trackAPICall('/api/graphql', duration, 500)

    return NextResponse.json(
      {
        errors: [
          {
            message: error.message || 'Internal server error',
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          },
        ],
      },
      { status: 500 }
    )
  }
}

// GET endpoint for GraphQL Playground/Introspection
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'PayAid V3 GraphQL API',
    version: '1.0.0',
    endpoint: '/api/graphql',
    documentation: `
# GraphQL API

## Endpoint
POST /api/graphql

## Authentication
Include JWT token in Authorization header:
Authorization: Bearer <token>

## Example Query

\`\`\`graphql
query {
  contacts(tenantId: "your-tenant-id", limit: 10) {
    id
    name
    email
    deals {
      id
      title
      value
    }
  }
}
\`\`\`

## Example Mutation

\`\`\`graphql
mutation {
  createContact(
    tenantId: "your-tenant-id"
    input: {
      name: "John Doe"
      email: "john@example.com"
    }
  ) {
    id
    name
    email
  }
}
\`\`\`

## Dashboard Query

\`\`\`graphql
query {
  dashboard(tenantId: "your-tenant-id") {
    contacts {
      total
      recent {
        id
        name
      }
    }
    deals {
      total
      totalValue
      recent {
        id
        title
        value
      }
    }
  }
}
\`\`\`
    `,
  })
}
