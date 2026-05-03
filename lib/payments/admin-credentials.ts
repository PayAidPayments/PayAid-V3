/**
 * Admin PayAid Payments Credentials
 * 
 * SECURITY: These credentials are for PayAid Admin Team ONLY
 * Used for platform-level payments (subscriptions, module purchases)
 * 
 * Tenants must configure their own credentials for their payment collections
 */

/**
 * Get admin PayAid Payments credentials
 * Only accessible to admin/owner users
 * 
 * @returns Admin PayAid Payments configuration
 */
export function getAdminPayAidCredentials(): {
  apiKey: string
  salt: string
  baseUrl: string
} {
  // Get from environment variables (secure, not exposed to client)
  const apiKey = process.env.PAYAID_ADMIN_API_KEY || process.env.PAYAID_PAYMENTS_API_KEY || ''
  const salt = process.env.PAYAID_ADMIN_SALT || process.env.PAYAID_PAYMENTS_SALT || ''
  const baseUrl = process.env.PAYAID_PAYMENTS_BASE_URL || process.env.PAYAID_PAYMENTS_PG_API_URL || 'https://api.payaidpayments.com'

  if (!apiKey || !salt) {
    throw new Error('Admin PayAid Payments credentials not configured. Please set PAYAID_ADMIN_API_KEY and PAYAID_ADMIN_SALT in environment variables.')
  }

  return {
    apiKey,
    salt,
    baseUrl,
  }
}

/**
 * Check if current user is admin/owner
 * Used to restrict access to admin credentials
 */
export function isAdminUser(role: string | undefined): boolean {
  return role === 'admin' || role === 'owner'
}

