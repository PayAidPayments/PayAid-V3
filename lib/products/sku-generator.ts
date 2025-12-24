/**
 * SKU Code Generator
 * Generates SKU codes from product names
 */

/**
 * Generate SKU code from product name
 * Format: First 3 letters of each word (uppercase) + random 4 digits
 * Example: "Laptop Computer" -> "LAPCOM1234"
 * 
 * @param productName - Product name
 * @param existingSkus - Array of existing SKUs to avoid duplicates (optional)
 * @returns Generated SKU code
 */
export function generateSKU(productName: string, existingSkus: string[] = []): string {
  if (!productName || productName.trim().length === 0) {
    // Generate random SKU if name is empty
    return `SKU${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
  }

  // Clean and normalize product name
  const cleaned = productName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces

  // Split into words
  const words = cleaned.split(' ').filter(word => word.length > 0)

  if (words.length === 0) {
    return `SKU${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
  }

  // Generate SKU prefix from words
  let prefix = ''
  if (words.length === 1) {
    // Single word: take first 6 characters
    prefix = words[0].substring(0, 6).padEnd(6, 'X')
  } else if (words.length === 2) {
    // Two words: 3 chars from each
    prefix = words[0].substring(0, 3) + words[1].substring(0, 3)
  } else {
    // Multiple words: 2 chars from first 3 words
    prefix = words
      .slice(0, 3)
      .map(word => word.substring(0, 2))
      .join('')
  }

  // Ensure prefix is at least 4 characters
  if (prefix.length < 4) {
    prefix = prefix.padEnd(4, 'X')
  }

  // Generate unique suffix (4 digits)
  let suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  let sku = `${prefix}${suffix}`

  // Check for duplicates and regenerate if needed
  let attempts = 0
  while (existingSkus.includes(sku) && attempts < 10) {
    suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    sku = `${prefix}${suffix}`
    attempts++
  }

  // If still duplicate, add more randomness
  if (existingSkus.includes(sku)) {
    sku = `${prefix}${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`
  }

  return sku
}

/**
 * Generate SKU with custom format
 * @param productName - Product name
 * @param format - Format string (e.g., "PROD-{name}-{num}")
 * @param existingSkus - Array of existing SKUs
 * @returns Generated SKU code
 */
export function generateCustomSKU(
  productName: string,
  format: string = 'PROD-{name}-{num}',
  existingSkus: string[] = []
): string {
  const cleaned = productName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6)

  const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  
  let sku = format
    .replace('{name}', cleaned)
    .replace('{num}', num)

  // Check for duplicates
  let attempts = 0
  while (existingSkus.includes(sku) && attempts < 10) {
    const newNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    sku = format.replace('{name}', cleaned).replace('{num}', newNum)
    attempts++
  }

  return sku
}
