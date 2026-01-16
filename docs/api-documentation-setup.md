# OpenAPI/Swagger Documentation Setup

**Last Updated:** January 15, 2026  
**Status:** Implementation Guide

---

## Overview

This guide sets up OpenAPI/Swagger documentation for PayAid V3's 577+ API endpoints.

---

## Installation

```bash
npm install swagger-jsdoc swagger-ui-react
# or
npm install @apidevtools/swagger-jsdoc swagger-ui-react
```

---

## Setup

### 1. Create Swagger Configuration

**File:** `lib/swagger/config.ts`

```typescript
import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PayAid V3 API',
      version: '3.0.0',
      description: 'Complete API documentation for PayAid V3 SaaS platform',
      contact: {
        name: 'PayAid Support',
        email: 'support@payaid.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'https://api.payaid.com',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Contacts', description: 'Contact management' },
      { name: 'Deals', description: 'Deal pipeline management' },
      { name: 'Invoices', description: 'Invoice management' },
      { name: 'Tasks', description: 'Task management' },
      { name: 'Dashboard', description: 'Dashboard and analytics' },
      { name: 'AI', description: 'AI-powered features' },
      { name: 'CRM', description: 'CRM module endpoints' },
      { name: 'HR', description: 'HR module endpoints' },
      { name: 'Finance', description: 'Finance module endpoints' },
    ],
  },
  apis: [
    './app/api/**/*.ts',
    './app/api/**/*.tsx',
  ],
}

export const swaggerSpec = swaggerJsdoc(options)
```

### 2. Create Swagger UI Route

**File:** `app/api/docs/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger/config'

export async function GET() {
  return NextResponse.json(swaggerSpec)
}
```

### 3. Create Swagger UI Page

**File:** `app/api-docs/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

export default function APIDocsPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => setSpec(data))
  }, [])

  if (!spec) {
    return <div>Loading API documentation...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">PayAid V3 API Documentation</h1>
      <SwaggerUI spec={spec} />
    </div>
  )
}
```

---

## Documenting Endpoints

### Example: Contact Endpoint

**File:** `app/api/contacts/route.ts`

```typescript
/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Get all contacts
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contact'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactInput'
 *     responses:
 *       201:
 *         description: Contact created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  // Implementation
}
```

### Define Schemas

**File:** `lib/swagger/schemas.ts`

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     Contact:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         company:
 *           type: string
 *         status:
 *           type: string
 *           enum: [lead, customer, partner]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ContactInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         company:
 *           type: string
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *             message:
 *               type: string
 *             details:
 *               type: object
 */
```

---

## Auto-Generation (Alternative)

### Using next-swagger-doc

```bash
npm install next-swagger-doc
```

**File:** `next.config.js`

```javascript
const nextSwaggerDoc = require('next-swagger-doc')

const swaggerDoc = nextSwaggerDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PayAid V3 API',
      version: '3.0.0',
    },
  },
  apiFolder: 'app/api',
})

module.exports = {
  // ... existing config
  async rewrites() {
    return [
      {
        source: '/api-docs.json',
        destination: '/api/swagger.json',
      },
    ]
  },
}
```

---

## CI/CD Integration

### Auto-generate on Deploy

**File:** `.github/workflows/api-docs.yml`

```yaml
name: Generate API Docs

on:
  push:
    branches: [main]
    paths:
      - 'app/api/**'

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run generate:api-docs
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/api
```

---

## Access Documentation

### Development
- URL: `http://localhost:3000/api-docs`
- Swagger UI with interactive testing

### Production
- URL: `https://payaid.com/api-docs`
- Read-only documentation

---

## Best Practices

1. **Document All Endpoints:**
   - Include request/response schemas
   - Add example requests/responses
   - Document error codes

2. **Keep Updated:**
   - Update docs when endpoints change
   - Use CI/CD to auto-generate
   - Review docs in PR process

3. **Security:**
   - Document authentication methods
   - Include rate limiting info
   - Document permission requirements

4. **Examples:**
   - Provide curl examples
   - Include code samples (TypeScript, JavaScript)
   - Add Postman collection export

---

## Next Steps

1. **Week 1:** Set up basic Swagger configuration
2. **Week 2:** Document 50 most-used endpoints
3. **Week 3:** Document remaining endpoints
4. **Week 4:** Set up CI/CD auto-generation
5. **Week 5:** Add interactive examples

---

**Last Updated:** January 15, 2026  
**Status:** Ready for Implementation
