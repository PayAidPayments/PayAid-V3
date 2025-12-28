/**
 * Encryption/Decryption for API Keys
 * AES-256-CBC encryption for sensitive data at rest
 */

import crypto from 'crypto'

// Get encryption key from environment
// If not set, generate a warning (but don't fail silently in production)
// Lazy evaluation to avoid build-time errors
let _encryptionKey: string | null = null
const getEncryptionKey = (): string => {
  if (_encryptionKey) return _encryptionKey
  
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    // During build time, allow missing key (will be set in production)
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.VERCEL === '1') {
      // During Vercel build, use a temporary key (won't be used in actual runtime)
      _encryptionKey = crypto.randomBytes(32).toString('hex')
      return _encryptionKey
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production environment')
    }
    console.warn('⚠️ ENCRYPTION_KEY not set. Using temporary key (not secure for production!)')
    _encryptionKey = crypto.randomBytes(32).toString('hex')
    return _encryptionKey
  }
  
  // Validate key format (should be 64 hex characters for AES-256)
  if (key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hexadecimal string. Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
  }
  
  _encryptionKey = key
  return _encryptionKey
}

/**
 * Encrypt sensitive data (API keys, tokens, etc.)
 * @param text - Plain text to encrypt
 * @returns Encrypted string with IV prefix (format: "iv:encrypted")
 */
export function encrypt(text: string): string {
  if (!text) return ''
  
  const encryptionKey = getEncryptionKey()
  const iv = crypto.randomBytes(16)
  const key = Buffer.from(encryptionKey.slice(0, 64), 'hex') // Ensure 32 bytes (64 hex chars)
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Decrypt sensitive data
 * @param encrypted - Encrypted string with IV prefix (format: "iv:encrypted")
 * @returns Decrypted plain text
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) return ''
  
  const [ivHex, encryptedData] = encrypted.split(':')
  if (!ivHex || !encryptedData) {
    throw new Error('Invalid encrypted data format')
  }
  
  const encryptionKey = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const key = Buffer.from(encryptionKey.slice(0, 64), 'hex') // Ensure 32 bytes (64 hex chars)
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
