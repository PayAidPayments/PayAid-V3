/**
 * Get tenant-specific PayAid Payments configuration
 * Fetches payment gateway settings from database and decrypts sensitive fields
 */

import { prisma } from '@/lib/db/prisma'
import { decrypt } from '@/lib/encryption'
import { PayAidConfig } from './payaid'

export interface TenantPaymentSettings {
  payaidApiKey: string | null
  payaidSalt: string | null
  payaidBaseUrl: string | null
  payaidEncryptionKey: string | null
  payaidDecryptionKey: string | null
  payaidWebhookSecret: string | null
  isConfigured: boolean
  isActive: boolean
  testMode: boolean
}

/**
 * Get tenant payment settings from database
 * @param tenantId - Tenant ID
 * @returns Payment settings or null if not configured
 */
export async function getTenantPaymentSettings(
  tenantId: string
): Promise<TenantPaymentSettings | null> {
  const settings = await prisma.tenantPaymentSettings.findUnique({
    where: { tenantId },
  })

  if (!settings) {
    return null
  }

  return {
    payaidApiKey: settings.payaidApiKey,
    payaidSalt: settings.payaidSalt ? decrypt(settings.payaidSalt) : null,
    payaidBaseUrl: settings.payaidBaseUrl,
    payaidEncryptionKey: settings.payaidEncryptionKey
      ? decrypt(settings.payaidEncryptionKey)
      : null,
    payaidDecryptionKey: settings.payaidDecryptionKey
      ? decrypt(settings.payaidDecryptionKey)
      : null,
    payaidWebhookSecret: settings.payaidWebhookSecret
      ? decrypt(settings.payaidWebhookSecret)
      : null,
    isConfigured: settings.isConfigured,
    isActive: settings.isActive,
    testMode: settings.testMode,
  }
}

/**
 * Get PayAid Payments config for a tenant
 * @param tenantId - Tenant ID
 * @returns PayAidConfig or null if not configured
 */
export async function getTenantPayAidConfig(
  tenantId: string
): Promise<PayAidConfig | null> {
  const settings = await getTenantPaymentSettings(tenantId)

  if (!settings || !settings.isConfigured || !settings.isActive) {
    return null
  }

  if (!settings.payaidApiKey || !settings.payaidSalt || !settings.payaidBaseUrl) {
    return null
  }

  return {
    apiKey: settings.payaidApiKey,
    salt: settings.payaidSalt,
    baseUrl: settings.payaidBaseUrl,
    encryptionKey: settings.payaidEncryptionKey || undefined,
    decryptionKey: settings.payaidDecryptionKey || undefined,
  }
}
