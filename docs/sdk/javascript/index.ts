/**
 * PayAid JavaScript/TypeScript SDK
 * Official SDK for PayAid V3 APIs
 */

export interface PayAidConfig {
  apiKey: string
  baseUrl?: string
  timeout?: number
}

export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  type: 'customer' | 'lead' | 'vendor' | 'employee'
  stage?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface Deal {
  id: string
  name: string
  value?: number
  stage: string
  probability?: number
  contactId?: string
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  total: number
  status: string
  createdAt: string
}

export class PayAidError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'PayAidError'
  }
}

export class PayAidClient {
  private apiKey: string
  private baseUrl: string
  private timeout: number

  constructor(config: PayAidConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.payaid.com'
    this.timeout = config.timeout || 30000
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(this.timeout),
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    const data = await response.json()

    if (!response.ok) {
      throw new PayAidError(
        response.status,
        data.error || 'Request failed',
        data
      )
    }

    return data.data || data
  }

  contacts = {
    list: async (options?: PaginationOptions & { search?: string }) => {
      const params = new URLSearchParams()
      if (options?.page) params.set('page', options.page.toString())
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.search) params.set('search', options.search)
      const query = params.toString()
      return this.request<{ data: Contact[]; pagination: any }>(
        'GET',
        `/api/v1/contacts${query ? `?${query}` : ''}`
      )
    },
    get: async (id: string) => {
      return this.request<Contact>('GET', `/api/v1/contacts/${id}`)
    },
    create: async (data: Partial<Contact>) => {
      return this.request<Contact>('POST', '/api/v1/contacts', data)
    },
    update: async (id: string, data: Partial<Contact>) => {
      return this.request<Contact>('PUT', `/api/v1/contacts/${id}`, data)
    },
    delete: async (id: string) => {
      return this.request<void>('DELETE', `/api/v1/contacts/${id}`)
    },
  }

  deals = {
    list: async (options?: PaginationOptions & { stage?: string }) => {
      const params = new URLSearchParams()
      if (options?.page) params.set('page', options.page.toString())
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.stage) params.set('stage', options.stage)
      const query = params.toString()
      return this.request<{ data: Deal[]; pagination: any }>(
        'GET',
        `/api/v1/deals${query ? `?${query}` : ''}`
      )
    },
    create: async (data: Partial<Deal>) => {
      return this.request<Deal>('POST', '/api/v1/deals', data)
    },
  }

  invoices = {
    list: async (options?: PaginationOptions & { status?: string }) => {
      const params = new URLSearchParams()
      if (options?.page) params.set('page', options.page.toString())
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.status) params.set('status', options.status)
      const query = params.toString()
      return this.request<{ data: Invoice[]; pagination: any }>(
        'GET',
        `/api/v1/invoices${query ? `?${query}` : ''}`
      )
    },
    create: async (data: {
      customerName: string
      customerEmail?: string
      items: Array<{ description: string; quantity: number; price: number }>
    }) => {
      return this.request<Invoice>('POST', '/api/v1/invoices', data)
    },
  }

  workflows = {
    list: async () => {
      return this.request<{ data: any[] }>('GET', '/api/v1/workflows')
    },
    create: async (data: any) => {
      return this.request<any>('POST', '/api/v1/workflows', data)
    },
  }
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  const providedSignature = signature.replace('sha256=', '')
  return expectedSignature === providedSignature
}
