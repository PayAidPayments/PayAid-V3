/**
 * PayAid Payments Hash Calculation
 * Based on official integration guide: SHA512 hash with SALT
 * 
 * Hash Algorithm:
 * 1. Sort parameters alphabetically
 * 2. Create pipe-delimited string: SALT|param1|param2|...
 * 3. Calculate SHA512 hash
 * 4. Convert to uppercase
 */

import crypto from 'crypto'

/**
 * Generate hash for API request
 * @param parameters - Object with API parameters
 * @param salt - SALT provided by PayAid Payments
 * @returns Uppercase SHA512 hash
 */
export function generateHash(parameters: Record<string, any>, salt: string): string {
  // Sort parameters by key alphabetically
  const sortedKeys = Object.keys(parameters).sort()
  
  // Create pipe-delimited string starting with SALT
  let hashData = salt
  
  // Append only non-empty values in alphabetical order
  for (const key of sortedKeys) {
    const value = parameters[key]
    if (value !== null && value !== undefined && value !== '') {
      hashData += '|' + String(value).trim()
    }
  }
  
  // Calculate SHA512 hash
  const hash = crypto.createHash('sha512').update(hashData).digest('hex')
  
  // Convert to uppercase
  return hash.toUpperCase()
}

/**
 * Verify response hash
 * @param response - Response object from PayAid Payments
 * @param salt - SALT provided by PayAid Payments
 * @returns true if hash matches, false otherwise
 */
export function verifyResponseHash(response: Record<string, any>, salt: string): boolean {
  // If hash field is null, no need to verify
  if (!response.hash) {
    return true
  }
  
  const responseHash = response.hash
  
  // Remove hash from response for calculation
  const responseWithoutHash = { ...response }
  delete responseWithoutHash.hash
  
  // Calculate expected hash
  const calculatedHash = generateHash(responseWithoutHash, salt)
  
  // Compare hashes (use timing-safe comparison)
  return crypto.timingSafeEqual(
    Buffer.from(responseHash),
    Buffer.from(calculatedHash)
  )
}

/**
 * Generate hash for JSON response (alternative method)
 * Used when response is in JSON format
 */
export function generateHashFromJSON(jsonString: string, salt: string): string {
  const hashData = salt + jsonString
  const hash = crypto.createHash('sha512').update(hashData).digest('hex')
  return hash.toUpperCase()
}
