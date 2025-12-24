/**
 * PayAid Payments Encryption/Decryption
 * Based on official integration guide: AES-256-CBC
 * 
 * Encryption: AES-256-CBC with encryption key
 * Decryption: AES-256-CBC with decryption key
 * Both encrypted data and IV are base64 encoded
 */

import crypto from 'crypto'

/**
 * Encrypt payment request data
 * @param plainData - JSON string of payment request
 * @param encryptionKey - Encryption key provided by PayAid Payments
 * @returns Object with base64 encoded encrypted_data and iv
 */
export function encryptPaymentRequest(
  plainData: string,
  encryptionKey: string
): { encrypted_data: string; iv: string } {
  // Generate random 16-byte IV (Initial Vector)
  const iv = crypto.randomBytes(16)
  
  // Create cipher using AES-256-CBC
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'utf-8'), iv)
  
  // Encrypt the data
  let encrypted = cipher.update(plainData, 'utf-8', 'base64')
  encrypted += cipher.final('base64')
  
  // Return base64 encoded encrypted data and IV
  return {
    encrypted_data: encrypted,
    iv: iv.toString('base64'),
  }
}

/**
 * Decrypt payment response data
 * @param encryptedData - Base64 encoded encrypted data
 * @param decryptionKey - Decryption key provided by PayAid Payments
 * @param iv - Base64 encoded Initial Vector
 * @returns Decrypted JSON string
 */
export function decryptPaymentResponse(
  encryptedData: string,
  decryptionKey: string,
  iv: string
): string {
  // Decode base64 IV
  const ivBuffer = Buffer.from(iv, 'base64')
  
  // Decode base64 encrypted data
  const encryptedBuffer = Buffer.from(encryptedData, 'base64')
  
  // Create decipher using AES-256-CBC
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(decryptionKey, 'utf-8'),
    ivBuffer
  )
  
  // Decrypt the data
  let decrypted = decipher.update(encryptedBuffer, undefined, 'utf-8')
  decrypted += decipher.final('utf-8')
  
  return decrypted
}
