import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/api-docs/openapi - Generate OpenAPI/Swagger documentation
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'api-integration-hub')

    // Generate OpenAPI 3.0 specification
    const openApiSpec = {
      openapi: '3.0.0',
      info: {
        title: 'PayAid V3 API',
        version: '3.0.0',
        description: 'PayAid V3 REST API Documentation',
        contact: {
          name: 'PayAid Support',
          email: 'support@payaid.com',
        },
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_APP_URL || 'https://app.payaid.com',
          description: 'Production server',
        },
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      paths: {
        '/api/contacts': {
          get: {
            summary: 'List contacts',
            tags: ['CRM'],
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                name: 'page',
                in: 'query',
                schema: { type: 'integer', default: 1 },
              },
              {
                name: 'limit',
                in: 'query',
                schema: { type: 'integer', default: 20 },
              },
            ],
            responses: {
              '200': {
                description: 'List of contacts',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        contacts: { type: 'array' },
                        total: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            summary: 'Create contact',
            tags: ['CRM'],
            security: [{ bearerAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string' },
                      phone: { type: 'string' },
                    },
                    required: ['name'],
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Contact created',
              },
            },
          },
        },
        '/api/invoices': {
          get: {
            summary: 'List invoices',
            tags: ['Finance'],
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'List of invoices',
              },
            },
          },
          post: {
            summary: 'Create invoice',
            tags: ['Finance'],
            security: [{ bearerAuth: [] }],
            responses: {
              '201': {
                description: 'Invoice created',
              },
            },
          },
        },
        '/api/products': {
          get: {
            summary: 'List products',
            tags: ['Inventory'],
            security: [{ bearerAuth: [] }],
            responses: {
              '200': {
                description: 'List of products',
              },
            },
          },
        },
        '/api/inventory/barcode/scan': {
          get: {
            summary: 'Scan barcode',
            tags: ['Inventory'],
            security: [{ bearerAuth: [] }],
            parameters: [
              {
                name: 'barcode',
                in: 'query',
                required: true,
                schema: { type: 'string' },
              },
            ],
            responses: {
              '200': {
                description: 'Product found',
              },
              '404': {
                description: 'Product not found',
              },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      tags: [
        { name: 'CRM', description: 'Customer Relationship Management' },
        { name: 'Finance', description: 'Finance and Accounting' },
        { name: 'Inventory', description: 'Inventory Management' },
        { name: 'Marketing', description: 'Marketing Automation' },
        { name: 'HR', description: 'Human Resources' },
        { name: 'Analytics', description: 'Analytics and Reporting' },
      ],
    }

    return NextResponse.json(openApiSpec)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Generate OpenAPI spec error:', error)
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    )
  }
}

