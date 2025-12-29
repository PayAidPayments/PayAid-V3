/**
 * Generate a personalized tenant ID from business name
 * Format: business-name-slug-random-suffix
 * Example: "Acme Corporation" -> "acme-corporation-a3b2"
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

  // Convert business name to URL-safe slug
  const slug = businessName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 30) // Limit length to 30 characters

  // If slug is empty after cleaning, use fallback
  if (!slug || slug.length === 0) {
    return generateRandomId()
  }

  // Generate short random suffix (4 alphanumeric characters)
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  
  // Combine slug and suffix
  let tenantId = `${slug}-${randomSuffix}`

  // Ensure total length doesn't exceed reasonable limits (CUIDs are typically 25 chars)
  // But we want to keep it readable, so max 40 chars
  if (tenantId.length > 40) {
    const maxSlugLength = 40 - randomSuffix.length - 1 // -1 for hyphen
    tenantId = `${slug.substring(0, maxSlugLength)}-${randomSuffix}`
  }

  // Check for duplicates and regenerate if needed
  let attempts = 0
  while (existingIds.includes(tenantId) && attempts < 10) {
    const newSuffix = Math.random().toString(36).substring(2, 6)
    tenantId = `${slug}-${newSuffix}`
    attempts++
  }

  // If still duplicate, add more randomness
  if (existingIds.includes(tenantId)) {
    const longerSuffix = Math.random().toString(36).substring(2, 8)
    tenantId = `${slug.substring(0, Math.min(20, slug.length))}-${longerSuffix}`
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
  // Must be lowercase alphanumeric with hyphens
  // Length between 5 and 50 characters
  const regex = /^[a-z0-9-]{5,50}$/
  return regex.test(tenantId) && !tenantId.startsWith('-') && !tenantId.endsWith('-')
}

