/**
 * Generate a personalized tenant ID from business name
 * Format: first-word-random-suffix
 * Example: "Demo Business Pvt Ltd" -> "demo-a3b2c1"
 * Example: "Acme Corporation" -> "acme-x9y8z7"
 * 
 * @param businessName - Business/tenant name
 * @param existingIds - Array of existing tenant IDs to avoid duplicates (optional)
 * @returns Generated tenant ID
 */
export function generateTenantId(businessName: string, existingIds: string[] = []): string {
  if (!businessName || businessName.trim().length === 0) {
    // Fallback to random ID if name is empty
    return generateRandomId()
  }

  // Extract first word from business name
  const firstWord = businessName
    .trim()
    .split(/\s+/)[0] // Get first word
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters, keep only alphanumeric
    .substring(0, 20) // Limit to 20 characters max

  // If first word is empty after cleaning, use fallback
  if (!firstWord || firstWord.length === 0) {
    return generateRandomId()
  }

  // Generate random suffix (6 alphanumeric characters for better uniqueness)
  // Format: lowercase letters and numbers
  const randomSuffix = Math.random()
    .toString(36) // Convert to base36 (0-9, a-z)
    .substring(2, 8) // Get 6 characters
    .toLowerCase()
  
  // Combine first word and suffix with hyphen for readability
  // Format: "demo-a3b2c1"
  let tenantId = `${firstWord}-${randomSuffix}`

  // Ensure total length doesn't exceed reasonable limits
  // Keep it under 30 characters for readability (including hyphen)
  if (tenantId.length > 30) {
    const maxWordLength = 30 - randomSuffix.length - 1 // -1 for hyphen
    tenantId = `${firstWord.substring(0, maxWordLength)}-${randomSuffix}`
  }

  // Check for duplicates and regenerate if needed
  let attempts = 0
  while (existingIds.includes(tenantId) && attempts < 10) {
    // Generate new random suffix
    const newSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toLowerCase()
    tenantId = `${firstWord}-${newSuffix}`
    attempts++
  }

  // If still duplicate, add more randomness with longer suffix
  if (existingIds.includes(tenantId)) {
    const longerSuffix = Math.random()
      .toString(36)
      .substring(2, 10) // 8 characters
      .toLowerCase()
    const maxWordLength = Math.min(15, firstWord.length) // Shorter word if needed
    tenantId = `${firstWord.substring(0, maxWordLength)}-${longerSuffix}`
  }

  return tenantId
}

/**
 * Generate a random tenant ID (fallback)
 * @returns Random alphanumeric ID
 */
function generateRandomId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `tenant-${timestamp}-${random}`
}

/**
 * Validate tenant ID format
 * @param tenantId - Tenant ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidTenantId(tenantId: string): boolean {
  // Must be lowercase alphanumeric with optional hyphen
  // Format: firstword-random-suffix (e.g., "demo-a3b2c1")
  // Length between 5 and 30 characters
  const regex = /^[a-z0-9-]{5,30}$/
  return regex.test(tenantId) && !tenantId.startsWith('-') && !tenantId.endsWith('-')
}

