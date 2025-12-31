/**
 * Encryption Service (Layer 5)
 * Application-level encryption for sensitive data
 */

import crypto from 'crypto'

class EncryptionService {
  private key: Buffer
  
  constructor() {
    const keyHex = process.env.ENCRYPTION_KEY
    if (!keyHex) {
      throw new Error('ENCRYPTION_KEY environment variable is not set')
    }
    
    // Key must be 32 bytes (64 hex characters) for AES-256
    if (keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    }
    
    this.key = Buffer.from(keyHex, 'hex')
  }
  
  /**
   * Encrypt plaintext using AES-256-GCM
   * Returns: iv:authTag:ciphertext (hex encoded)
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv)
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Return: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }
  
  /**
   * Decrypt ciphertext
   * Input format: iv:authTag:ciphertext (hex encoded)
   */
  decrypt(encrypted: string): string {
    const parts = encrypted.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }
    
    const [ivHex, authTagHex, ciphertext] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
  
  /**
   * Generate a new encryption key (for key rotation)
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}

// Singleton instance
let encryptionService: EncryptionService | null = null

export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    encryptionService = new EncryptionService()
  }
  return encryptionService
}

// Export for direct use
export { EncryptionService }

