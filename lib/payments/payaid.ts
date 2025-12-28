/**
 * PayAid Payments API Integration
 * Based on official integration guide PDF
 * https://payaidpayments.com/wp-content/uploads/2023/05/Payment_Gateway_Integration_Guide.pdf
 * 
 * This is the ONLY payment gateway used in PayAid V3
 * All payments must go through PayAid Payments API
 */

import { generateHash, verifyResponseHash } from './payaid-hash'
import { encryptPaymentRequest, decryptPaymentResponse } from './payaid-encryption'

export interface PayAidConfig {
  apiKey: string
  salt: string // Used for hash calculation
  encryptionKey?: string // For encrypted payment requests
  decryptionKey?: string // For decrypting payment responses
  baseUrl: string // pg_api_url from PayAid Payments
}

interface PaymentRequestParams {
  order_id: string // Merchant reference number (unique)
  amount: number // Payment amount (decimal 12,2)
  currency: string // Always "INR"
  description: string // Brief description
  name: string // Customer name
  email: string // Customer email
  phone: string // Customer phone
  address_line_1?: string
  address_line_2?: string
  city: string
  state?: string
  country: string // Default "India"
  zip_code: string
  return_url: string // Success callback URL
  return_url_failure?: string // Failure callback URL
  return_url_cancel?: string // Cancel callback URL
  mode?: 'TEST' | 'LIVE' // Payment mode
  timeout_duration?: string // Timeout in seconds
  udf1?: string // User defined fields
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
  payment_options?: string // Comma separated: cc,nb,w,atm,upi,dp
  allowed_bank_codes?: string // Comma separated bank codes
  split_info?: string // JSON string for vendor splits
  split_enforce_strict?: 'y' | 'n' // Require split before settlement
}

interface PaymentResponse {
  transaction_id: string
  payment_mode: string
  payment_channel: string
  payment_datetime: string
  response_code: number // 0 = success, non-zero = error
  response_message: string
  error_desc?: string
  order_id: string
  amount: string
  currency: string
  description: string
  name: string
  email: string
  phone: string
  address_line_1?: string
  address_line_2?: string
  city: string
  state?: string
  country: string
  zip_code: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
  tdr_amount?: string
  tax_on_tdr_amount?: string
  amount_orig?: string
  cardmasked?: string
  hash: string
}

interface PaymentStatusParams {
  order_id?: string // Comma separated for multiple
  transaction_id?: string
  bank_code?: string
  response_code?: number
  customer_phone?: string
  customer_email?: string
  customer_name?: string
  date_from?: string // DD-MM-YYYY or YYYY-MM-DD HH:MM:SS
  date_to?: string
  page_number?: number
  per_page?: number // 1-50
}

interface RefundRequestParams {
  transaction_id: string
  merchant_refund_id?: string // Unique refund reference
  merchant_order_id?: string
  amount: number // Refund amount (must be <= transaction amount)
  description: string
}

interface RefundStatusParams {
  transaction_id: string
  merchant_order_id?: string
}

export class PayAidPayments {
  private config: PayAidConfig
  private baseUrl: string

  constructor(config?: PayAidConfig) {
    if (config) {
      // Use provided config (tenant-specific)
      this.config = config
      this.baseUrl = config.baseUrl
    } else {
      // Fallback to environment variables (for backward compatibility)
      this.config = {
        apiKey: process.env.PAYAID_PAYMENTS_API_KEY || '',
        salt: process.env.PAYAID_PAYMENTS_SALT || '',
        encryptionKey: process.env.PAYAID_PAYMENTS_ENCRYPTION_KEY,
        decryptionKey: process.env.PAYAID_PAYMENTS_DECRYPTION_KEY,
        baseUrl: process.env.PAYAID_PAYMENTS_BASE_URL || process.env.PAYAID_PAYMENTS_PG_API_URL || '',
      }
      this.baseUrl = this.config.baseUrl
    }
  }

  /**
   * Make API request to PayAid Payments
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    params?: Record<string, any>,
    useEncryption: boolean = false
  ): Promise<T> {
    if (!this.config.apiKey || !this.config.salt) {
      throw new Error('PayAid Payments API key and SALT must be configured')
    }

    const url = `${this.baseUrl}${endpoint}`

    let requestBody: any
    let headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (params) {
      if (useEncryption && this.config.encryptionKey) {
        // Encrypted payment request
        const jsonData = JSON.stringify({
          ...params,
          api_key: this.config.apiKey,
        })
        const encrypted = encryptPaymentRequest(jsonData, this.config.encryptionKey)
        requestBody = {
          api_key: this.config.apiKey,
          encrypted_data: encrypted.encrypted_data,
          iv: encrypted.iv,
        }
      } else {
        // Regular payment request with hash
        // Add api_key to params for hash calculation
        const paramsWithKey = {
          ...params,
          api_key: this.config.apiKey,
        }
        
        // Generate hash
        const hash = generateHash(paramsWithKey, this.config.salt)
        
        // Add hash to request
        requestBody = {
          ...paramsWithKey,
          hash,
        }
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(`PayAid Payments API error: ${error.message || response.statusText}`)
      }

      const data = await response.json()

      // Verify response hash if present
      if (data.hash && !verifyResponseHash(data, this.config.salt)) {
        throw new Error('Invalid response hash - possible tampering')
      }

      return data as T
    } catch (error) {
      console.error('PayAid Payments API request failed:', error)
      throw error
    }
  }

  /**
   * Create Payment Request
   * URL: https://{pg_api_url}/v2/paymentrequest
   */
  async createPaymentRequest(params: PaymentRequestParams): Promise<PaymentResponse> {
    // Ensure amount is in correct format (decimal 12,2)
    const paymentParams: any = {
      ...params,
      amount: params.amount.toFixed(2),
      currency: params.currency || 'INR',
      country: params.country || 'India',
      mode: params.mode || 'LIVE',
    }

    return this.request<PaymentResponse>('/v2/paymentrequest', 'POST', paymentParams)
  }

  /**
   * Create Encrypted Payment Request
   * URL: https://{pg_api_url}/v2/paymentrequest
   */
  async createEncryptedPaymentRequest(params: PaymentRequestParams): Promise<PaymentResponse> {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not configured')
    }

    const paymentParams: any = {
      ...params,
      amount: params.amount.toFixed(2),
      currency: params.currency || 'INR',
      country: params.country || 'India',
      mode: params.mode || 'LIVE',
    }

    return this.request<PaymentResponse>('/v2/paymentrequest', 'POST', paymentParams, true)
  }

  /**
   * Get Payment Request URL (Two Step Integration)
   * URL: https://{pg_api_url}/v2/getpaymentrequesturl
   * Returns a unique URL that can be opened in browser/app
   */
  async getPaymentRequestUrl(
    params: PaymentRequestParams & { expiry_in_minutes?: number }
  ): Promise<{
    url: string
    uuid: string
    expiry_datetime: string
    order_id: string
  }> {
    const paymentParams: any = {
      ...params,
      amount: params.amount.toFixed(2),
      currency: params.currency || 'INR',
      country: params.country || 'India',
      mode: params.mode || 'LIVE',
    }

    const response = await this.request<{ data: any }>(
      '/v2/getpaymentrequesturl',
      'POST',
      paymentParams
    )

    return response.data
  }

  /**
   * Expire Payment Request URL
   * URL: https://{pg_api_url}/v2/expirepaymentrequesturl
   */
  async expirePaymentRequestUrl(uuid: string): Promise<{ code: string; message: string }> {
    const params = {
      uuid,
    }

    const response = await this.request<{ data: any }>(
      '/v2/expirepaymentrequesturl',
      'POST',
      params
    )

    return response.data
  }

  /**
   * Get Payment Status
   * URL: https://{pg_api_url}/v2/paymentstatus
   */
  async getPaymentStatus(params: PaymentStatusParams): Promise<{
    data: PaymentResponse[]
    page?: {
      total: number
      per_page: number
      current_page: number
      last_page: number
      from: number
      to: number
    }
    hash: string
  }> {
    return this.request('/v2/paymentstatus', 'POST', params)
  }

  /**
   * Create Refund Request
   * URL: https://{pg_api_url}/v2/refundrequest
   */
  async createRefund(params: RefundRequestParams): Promise<{
    transaction_id: string
    refund_id: number
    refund_reference_no: string | null
    merchant_refund_id?: string
    merchant_order_id?: string
  }> {
    const refundParams: any = {
      ...params,
      amount: params.amount.toFixed(2),
    }

    const response = await this.request<{ data: any }>(
      '/v2/refundrequest',
      'POST',
      refundParams
    )

    return response.data
  }

  /**
   * Get Refund Status
   * URL: https://{pg_api_url}/v2/refundstatus
   */
  async getRefundStatus(params: RefundStatusParams): Promise<{
    transaction_id: string
    merchant_order_id?: string
    refund_amount: number
    transaction_amount: string
    refund_details: Array<{
      refund_id: number
      refund_reference_no: string | null
      merchant_refund_id?: string
      refund_amount: string
      refund_status: string
      date: string
    }>
    hash: string
  }> {
    const response = await this.request<{ data: any }>(
      '/v2/refundstatus',
      'POST',
      params
    )

    return response.data
  }

  /**
   * Decrypt payment response (for encrypted payment requests)
   */
  decryptPaymentResponse(encryptedData: string, iv: string): PaymentResponse {
    if (!this.config.decryptionKey) {
      throw new Error('Decryption key not configured')
    }

    const decryptedJson = decryptPaymentResponse(
      encryptedData,
      this.config.decryptionKey,
      iv
    )

    const response: PaymentResponse = JSON.parse(decryptedJson)

    // Verify hash
    if (response.hash && !verifyResponseHash(response, this.config.salt)) {
      throw new Error('Invalid response hash - possible tampering')
    }

    return response
  }

  /**
   * Verify webhook signature
   * Webhooks use the same hash verification
   */
  verifyWebhookSignature(payload: Record<string, any>): boolean {
    return verifyResponseHash(payload, this.config.salt)
  }
}

// Helper function to create PayAidPayments instance with tenant-specific config
export function createPayAidPayments(config: PayAidConfig): PayAidPayments {
  return new PayAidPayments(config)
}

// Singleton instance (for backward compatibility - uses env vars)
let payaidPaymentsInstance: PayAidPayments | null = null

/**
 * Get PayAid Payments instance
 * Uses admin credentials by default (for platform payments)
 * For tenant-specific payments, use getTenantPayAidConfig() instead
 */
export function getPayAidPayments(): PayAidPayments {
  if (!payaidPaymentsInstance) {
    // Use admin credentials for platform payments
    const adminConfig = {
      apiKey: process.env.PAYAID_ADMIN_API_KEY || process.env.PAYAID_PAYMENTS_API_KEY || '',
      salt: process.env.PAYAID_ADMIN_SALT || process.env.PAYAID_PAYMENTS_SALT || '',
      baseUrl: process.env.PAYAID_PAYMENTS_BASE_URL || process.env.PAYAID_PAYMENTS_PG_API_URL || 'https://api.payaidpayments.com',
      encryptionKey: process.env.PAYAID_ADMIN_ENCRYPTION_KEY || process.env.PAYAID_PAYMENTS_ENCRYPTION_KEY,
      decryptionKey: process.env.PAYAID_ADMIN_DECRYPTION_KEY || process.env.PAYAID_PAYMENTS_DECRYPTION_KEY,
    }
    payaidPaymentsInstance = new PayAidPayments(adminConfig)
  }
  return payaidPaymentsInstance
}

// Default export (for backward compatibility)
export default getPayAidPayments()
