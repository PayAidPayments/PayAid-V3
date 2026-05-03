import { NextRequest, NextResponse } from 'next/server'

/**
 * Generate OpenAPI 3.0 specification for PayAid V3 APIs
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'PayAid V3 API',
      version: '3.0.0',
      description: 'Comprehensive API documentation for PayAid V3 - Business Management Platform',
      contact: {
        name: 'PayAid Support',
        email: 'support@payaid.com',
      },
    },
    servers: [
      {
        url: baseUrl,
        description: 'Production Server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        Contact: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            type: { type: 'string', enum: ['customer', 'lead', 'vendor', 'employee'] },
            status: { type: 'string', enum: ['active', 'inactive', 'lost'] },
          },
        },
        Contract: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            contractNumber: { type: 'string' },
            title: { type: 'string' },
            contractType: { type: 'string', enum: ['SERVICE', 'SALES', 'PURCHASE', 'EMPLOYMENT', 'NDA', 'OTHER'] },
            status: { type: 'string', enum: ['DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED'] },
            partyName: { type: 'string' },
            value: { type: 'number' },
            currency: { type: 'string' },
          },
        },
        Workflow: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            triggerType: { type: 'string', enum: ['EVENT', 'SCHEDULE', 'MANUAL'] },
            isActive: { type: 'boolean' },
            steps: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    paths: {
      '/api/contacts': {
        get: {
          summary: 'List contacts',
          description: 'Get a list of all contacts',
          tags: ['Contacts'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'type', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'List of contacts',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      contacts: { type: 'array', items: { $ref: '#/components/schemas/Contact' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create contact',
          description: 'Create a new contact',
          tags: ['Contacts'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Contact' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Contact created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Contact' },
                },
              },
            },
          },
        },
      },
      '/api/contracts': {
        get: {
          summary: 'List contracts',
          description: 'Get a list of all contracts',
          tags: ['Contracts'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of contracts',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      contracts: { type: 'array', items: { $ref: '#/components/schemas/Contract' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create contract',
          description: 'Create a new contract',
          tags: ['Contracts'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Contract' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Contract created',
            },
          },
        },
      },
      '/api/workflows': {
        get: {
          summary: 'List workflows',
          description: 'Get a list of all workflows',
          tags: ['Workflows'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of workflows',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      workflows: { type: 'array', items: { $ref: '#/components/schemas/Workflow' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create workflow',
          description: 'Create a new workflow',
          tags: ['Workflows'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Workflow' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Workflow created',
            },
          },
        },
      },
      '/api/webhooks': {
        get: {
          summary: 'List webhooks',
          description: 'Get a list of all webhooks',
          tags: ['Webhooks'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of webhooks',
            },
          },
        },
        post: {
          summary: 'Create webhook',
          description: 'Create a new webhook',
          tags: ['Webhooks'],
          security: [{ bearerAuth: [] }],
          responses: {
            '201': {
              description: 'Webhook created',
            },
          },
        },
      },
    },
  }

  return NextResponse.json(openApiSpec)
}

