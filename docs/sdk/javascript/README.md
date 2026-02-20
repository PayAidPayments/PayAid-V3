# PayAid JavaScript/TypeScript SDK

Official SDK for integrating PayAid V3 APIs into your JavaScript/TypeScript applications.

## Installation

```bash
npm install @payaid/sdk
# or
yarn add @payaid/sdk
```

## Quick Start

```typescript
import { PayAidClient } from '@payaid/sdk'

const client = new PayAidClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.payaid.com',
})

// List contacts
const contacts = await client.contacts.list({ page: 1, limit: 50 })

// Create a contact
const contact = await client.contacts.create({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
})

// Create a deal
const deal = await client.deals.create({
  name: 'New Deal',
  value: 10000,
  contactId: contact.id,
  stage: 'prospecting',
})
```

## API Reference

### Contacts

```typescript
// List contacts
client.contacts.list(options?: {
  page?: number
  limit?: number
  search?: string
})

// Get contact
client.contacts.get(id: string)

// Create contact
client.contacts.create(data: {
  name: string
  email?: string
  phone?: string
  company?: string
  type?: 'customer' | 'lead' | 'vendor' | 'employee'
})

// Update contact
client.contacts.update(id: string, data: Partial<Contact>)

// Delete contact
client.contacts.delete(id: string)
```

### Deals

```typescript
// List deals
client.deals.list(options?: {
  page?: number
  limit?: number
  stage?: string
})

// Create deal
client.deals.create(data: {
  name: string
  value?: number
  stage?: string
  contactId?: string
})
```

### Invoices

```typescript
// List invoices
client.invoices.list(options?: {
  page?: number
  limit?: number
  status?: string
})

// Create invoice
client.invoices.create(data: {
  customerName: string
  customerEmail?: string
  items: Array<{
    description: string
    quantity: number
    price: number
  }>
})
```

### Workflows

```typescript
// List workflows
client.workflows.list()

// Create workflow
client.workflows.create(data: {
  name: string
  triggerType: 'EVENT' | 'SCHEDULE' | 'MANUAL'
  triggerEvent?: string
  steps: Array<WorkflowStep>
})
```

## Error Handling

```typescript
try {
  const contact = await client.contacts.create({ name: 'Test' })
} catch (error) {
  if (error instanceof PayAidError) {
    console.error('API Error:', error.message)
    console.error('Status:', error.status)
    console.error('Details:', error.details)
  }
}
```

## Rate Limiting

The SDK automatically handles rate limiting and includes rate limit headers in responses:

```typescript
const response = await client.contacts.list()
console.log('Rate limit:', response.headers['x-ratelimit-limit'])
console.log('Remaining:', response.headers['x-ratelimit-remaining'])
```

## Webhooks

```typescript
import { verifyWebhookSignature } from '@payaid/sdk'

// Verify webhook signature
const isValid = verifyWebhookSignature(
  requestBody,
  signature,
  webhookSecret
)

if (isValid) {
  // Process webhook event
  const event = JSON.parse(requestBody)
  console.log('Event:', event.event)
  console.log('Data:', event.data)
}
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import type { Contact, Deal, Invoice, Workflow } from '@payaid/sdk'
```

## Examples

See `/examples` directory for complete examples:
- Node.js server
- React component
- Next.js API route
- Webhook handler

## License

MIT
