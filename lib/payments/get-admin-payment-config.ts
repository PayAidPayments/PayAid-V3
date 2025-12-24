/**
 * Get Admin PayAid Payments Configuration
 * 
 * SECURITY: Admin-only credentials for platform payments
 * Used for:
 * - Module subscription payments
 * - App Store purchases
 * - Platform-level transactions
 * 
 * Tenants use their own credentials (configured in TenantPaymentSettings)
 */

import { PayAidConfig } from './payaid'
import { getAdminPayAidCredentials } from './admin-credentials'

/**
 * Get admin PayAid Payments configuration
 * Only for platform-level payments (subscriptions, module purchases)
 * 
 * @returns PayAidConfig for admin payments
 */
export function getAdminPayAidConfig(): PayAidConfig {
  const credentials = getAdminPayAidCredentials()

  return {
    apiKey: credentials.apiKey,
    salt: credentials.salt,
    baseUrl: credentials.baseUrl,
    encryptionKey: process.env.PAYAID_ADMIN_ENCRYPTION_KEY || process.env.PAYAID_PAYMENTS_ENCRYPTION_KEY,
    decryptionKey: process.env.PAYAID_ADMIN_DECRYPTION_KEY || process.env.PAYAID_PAYMENTS_DECRYPTION_KEY,
  }
}

