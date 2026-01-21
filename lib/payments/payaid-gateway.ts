/**
 * PayAid Payments Gateway Integration
 * MANDATORY: This is the ONLY payment gateway used in PayAid V3
 * 
 * Based on official integration guide:
 * https://payaidpayments.com/api-developer-kits/
 * https://payaidpayments.com/wp-content/uploads/2023/05/Payment_Gateway_Integration_Guide.pdf
 */

import { PayAidPayments, PayAidConfig } from './payaid'
import { rupeesToPaise, paiseToRupees, validateINR } from '@/lib/currency'

export interface CreatePaymentLinkRequest {
  amount: number // Amount in ₹ (INR)
  currency: 'INR' // Always INR
  merchantId: string
  transactionId: string
  customerEmail: string
  customerPhone: string
  description: string
  redirectUrl: string
  webhookUrl: string
  metadata?: Record<string, string>
}

export interface PaymentLinkResponse {
  success: boolean
  paymentLink?: string
  transactionId?: string
  expiresAt?: Date
  error?: string
}

export interface PaymentStatusResponse {
  success: boolean
  status?: 'pending' | 'completed' | 'failed' | 'refunded'
  amount?: number // In ₹
  paidAt?: Date
  error?: string
}

export interface RefundResponse {
  success: boolean
  refundId?: string
  error?: string
}

/**
 * Create payment link for PayAid Payments
 * Converts ₹ to paise automatically (PayAid API uses paise)
 */
export async function createPaymentLink(
  request: CreatePaymentLinkRequest
): Promise<PaymentLinkResponse> {
  try {
    // Validate currency is INR
    validateINR(request.currency)

    // Initialize PayAid Payments client
    const config: PayAidConfig = {
      apiKey: process.env.PAYAID_API_KEY || '',
      salt: process.env.PAYAID_SECRET_KEY || '',
      baseUrl: process.env.PAYAID_ENVIRONMENT === 'production'
        ? process.env.PAYAID_PAYMENTS_BASE_URL || 'https://api.payaidpayments.com'
        : process.env.PAYAID_PAYMENTS_SANDBOX_URL || 'https://sandbox.payaidpayments.com',
      encryptionKey: process.env.PAYAID_ENCRYPTION_KEY,
      decryptionKey: process.env.PAYAID_DECRYPTION_KEY,
    }

    const payaid = new PayAidPayments(config)

    // Convert ₹ to paise for API
    const amountInPaise = rupeesToPaise(request.amount)

    // Create payment request
    const paymentResponse = await payaid.getPaymentRequestUrl({
      order_id: request.transactionId,
      amount: request.amount, // API expects decimal format
      currency: 'INR',
      description: request.description,
      name: request.customerEmail.split('@')[0] || 'Customer',
      email: request.customerEmail,
      phone: request.customerPhone,
      return_url: request.redirectUrl,
      return_url_failure: request.redirectUrl,
      return_url_cancel: request.redirectUrl,
      mode: process.env.PAYAID_ENVIRONMENT === 'production' ? 'LIVE' : 'TEST',
      udf1: request.metadata ? JSON.stringify(request.metadata) : undefined,
    })

    return {
      success: true,
      paymentLink: paymentResponse.url,
      transactionId: paymentResponse.order_id,
      expiresAt: new Date(paymentResponse.expiry_datetime),
    }
  } catch (error) {
    console.error('PayAid Payment Link Creation Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Verify payment status
 */
export async function verifyPaymentStatus(
  transactionId: string
): Promise<PaymentStatusResponse> {
  try {
    const config: PayAidConfig = {
      apiKey: process.env.PAYAID_API_KEY || '',
      salt: process.env.PAYAID_SECRET_KEY || '',
      baseUrl: process.env.PAYAID_ENVIRONMENT === 'production'
        ? process.env.PAYAID_PAYMENTS_BASE_URL || 'https://api.payaidpayments.com'
        : process.env.PAYAID_PAYMENTS_SANDBOX_URL || 'https://sandbox.payaidpayments.com',
    }

    const payaid = new PayAidPayments(config)

    const statusResponse = await payaid.getPaymentStatus({
      order_id: transactionId,
    })

    if (statusResponse.data && statusResponse.data.length > 0) {
      const payment = statusResponse.data[0]
      
      // Convert paise to ₹
      const amountInRupees = parseFloat(payment.amount)

      return {
        success: true,
        status: payment.response_code === 0 ? 'completed' : 'failed',
        amount: amountInRupees,
        paidAt: payment.payment_datetime ? new Date(payment.payment_datetime) : undefined,
      }
    }

    return {
      success: false,
      error: 'Payment not found',
    }
  } catch (error) {
    console.error('PayAid Verification Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Refund payment
 */
export async function refundPayment(
  transactionId: string,
  refundAmount?: number // In ₹, if not provided, full refund
): Promise<RefundResponse> {
  try {
    const config: PayAidConfig = {
      apiKey: process.env.PAYAID_API_KEY || '',
      salt: process.env.PAYAID_SECRET_KEY || '',
      baseUrl: process.env.PAYAID_ENVIRONMENT === 'production'
        ? process.env.PAYAID_PAYMENTS_BASE_URL || 'https://api.payaidpayments.com'
        : process.env.PAYAID_PAYMENTS_SANDBOX_URL || 'https://sandbox.payaidpayments.com',
    }

    const payaid = new PayAidPayments(config)

    const refundResponse = await payaid.createRefund({
      transaction_id: transactionId,
      amount: refundAmount || 0, // If 0, full refund
      description: refundAmount ? `Partial refund of ₹${refundAmount}` : 'Full refund',
    })

    return {
      success: true,
      refundId: refundResponse.refund_reference_no || refundResponse.refund_id.toString(),
    }
  } catch (error) {
    console.error('PayAid Refund Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  try {
    const crypto = require('crypto')
    const hash = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex')
    
    return hash === signature
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return false
  }
}
