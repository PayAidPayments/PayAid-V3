export type IrnGenerationPayload = {
  tenantId: string
  invoiceId: string
  invoiceNumber: string
  invoiceDate: string
  sellerGstin: string
  buyerGstin: string
  total: number
}

export type IrnGenerationResult = {
  irn: string
  irnDate: string
  qrCodeUrl: string
}

export type Supplier2bStatus = {
  filed: boolean
  filingPeriod: string
  message?: string
}

export interface GstComplianceProvider {
  generateIrn(payload: IrnGenerationPayload, credentials: Record<string, string>): Promise<IrnGenerationResult>
  validateIrn(irn: string, credentials: Record<string, string>): Promise<{ valid: boolean; reason?: string }>
  getSupplier2bStatus(supplierGstin: string, period: string, credentials: Record<string, string>): Promise<Supplier2bStatus>
}

class HttpGspProvider implements GstComplianceProvider {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
  }

  private async call<T>(path: string, payload: Record<string, unknown>, credentials: Record<string, string>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(credentials.gspApiKey ? { 'x-api-key': credentials.gspApiKey } : {}),
        ...(credentials.gspApiSecret ? { 'x-api-secret': credentials.gspApiSecret } : {}),
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => 'GSP request failed')
      throw new Error(`GSP error (${res.status}): ${err}`)
    }
    return (await res.json()) as T
  }

  async generateIrn(payload: IrnGenerationPayload, credentials: Record<string, string>): Promise<IrnGenerationResult> {
    return this.call<IrnGenerationResult>('/irn/generate', payload, credentials)
  }

  async validateIrn(irn: string, credentials: Record<string, string>): Promise<{ valid: boolean; reason?: string }> {
    return this.call<{ valid: boolean; reason?: string }>('/irn/validate', { irn }, credentials)
  }

  async getSupplier2bStatus(supplierGstin: string, period: string, credentials: Record<string, string>): Promise<Supplier2bStatus> {
    return this.call<Supplier2bStatus>('/gstr2b/status', { supplierGstin, period }, credentials)
  }
}

class StubGspProvider implements GstComplianceProvider {
  async generateIrn(payload: IrnGenerationPayload): Promise<IrnGenerationResult> {
    const now = new Date().toISOString()
    return {
      irn: `IRN-${payload.invoiceNumber}-${Date.now()}`,
      irnDate: now,
      qrCodeUrl: `https://payaid.local/qr/${encodeURIComponent(payload.invoiceNumber)}`,
    }
  }

  async validateIrn(irn: string): Promise<{ valid: boolean; reason?: string }> {
    if (!irn) return { valid: false, reason: 'Missing IRN' }
    return { valid: true }
  }

  async getSupplier2bStatus(supplierGstin: string, period: string): Promise<Supplier2bStatus> {
    if (!supplierGstin || !period) return { filed: false, filingPeriod: period, message: 'Insufficient details' }
    return { filed: true, filingPeriod: period }
  }
}

export function getGspProvider(): GstComplianceProvider {
  const baseUrl = process.env.GSP_BASE_URL || process.env.GSP_API_BASE_URL
  if (baseUrl) return new HttpGspProvider(baseUrl)
  return new StubGspProvider()
}
