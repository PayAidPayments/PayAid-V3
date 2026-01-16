/**
 * API Key Management (Layer 4)
 * Secure API key generation, hashing, and validation
 */

import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

export interface APIKeyData {
  orgId: string
  name: string
  scopes: string[]
  rateLimit?: number
  ipWhitelist?: string[]
  expiresAt?: Date
}

/**
 * Generate a new API key
 * Returns the key (show once) and metadata
 */
export async function generateAPIKey(data: APIKeyData) {
  // Generate secure random key
  const key = randomBytes(32).toString('hex')
  const hashedKey = await bcrypt.hash(key, 12)
  
  // Store hashed key (can't recover original)
  const apiKey = await prisma.apiKey.create({
    data: {
      orgId: data.orgId,
      name: data.name,
      keyHash: hashedKey,
      scopes: data.scopes,
      rateLimit: data.rateLimit || 100,
      ipWhitelist: data.ipWhitelist || [],
      expiresAt: data.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
    },
  })
  
  // Log creation
  await auditLog({
    orgId: data.orgId,
    userId: 'system',
    action: 'CREATE_API_KEY',
    resourceType: 'api_keys',
    resourceId: apiKey.id,
    changes: { after: { name: data.name, scopes: data.scopes } },
  })
  
  return {
    id: apiKey.id,
    key: key, // Show once (user must save)
    name: data.name,
    createdAt: apiKey.createdAt,
  }
}

/**
 * Check API key rate limit
 */
async function checkAPIKeyRateLimit(
  apiKeyId: string,
  rateLimit: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Count requests in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const requestCount = await prisma.apiUsageLog.count({
    where: {
      apiKeyId,
      timestamp: { gte: oneHourAgo },
    },
  })

  const remaining = Math.max(0, rateLimit - requestCount)
  const allowed = requestCount < rateLimit
  const resetTime = Date.now() + 60 * 60 * 1000 // 1 hour from now

  return { allowed, remaining, resetTime }
}

/**
 * Validate API key from Authorization header
 */
export async function validateAPIKey(
  authHeader: string | null,
  clientIP: string
): Promise<{ valid: true; orgId: string; scopes: string[]; apiKeyId: string } | { valid: false }> {
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false }
  }
  
  const keyString = authHeader.substring(7)
  
  // Get all active API keys
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      expiresAt: { gt: new Date() },
    },
  })
  
  // Check each key (bcrypt is slow, but we need to check all)
  for (const apiKey of apiKeys) {
    const isValid = await bcrypt.compare(keyString, apiKey.keyHash)
    
    if (isValid) {
      // Check IP whitelist
      if (apiKey.ipWhitelist.length > 0) {
        const isWhitelisted = apiKey.ipWhitelist.some(ip => {
          if (ip.includes('/')) {
            // CIDR notation
            return isIPInCIDR(clientIP, ip)
          }
          return clientIP === ip
        })
        
        if (!isWhitelisted) {
          return { valid: false }
        }
      }
      
      // Check rate limit
      const rateLimitResult = await checkAPIKeyRateLimit(apiKey.id, apiKey.rateLimit)
      if (!rateLimitResult.allowed) {
        return { valid: false }
      }
      
      return {
        valid: true,
        orgId: apiKey.orgId,
        scopes: apiKey.scopes,
        apiKeyId: apiKey.id,
      }
    }
  }
  
  return { valid: false }
}

/**
 * Check if IP is in CIDR range
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  // Simplified CIDR check (for production, use ipaddr.js)
  const [network, prefixLength] = cidr.split('/')
  // For now, just do exact match
  return ip === network
}

/**
 * Revoke an API key
 */
export async function revokeAPIKey(apiKeyId: string, orgId: string) {
  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { expiresAt: new Date() }, // Expire immediately
  })
  
  await auditLog({
    orgId,
    userId: 'system',
    action: 'REVOKE_API_KEY',
    resourceType: 'api_keys',
    resourceId: apiKeyId,
  })
}

// Import auditLog
import { auditLog } from './audit-log'

