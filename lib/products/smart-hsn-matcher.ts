/**
 * Smart HSN/SAC Code Matcher
 * Finds the best matching HSN/SAC code based on product name and description
 */

import { searchHSNCodes, allGSTRates } from '@/lib/data/gst-rates'
import { GSTRateItem } from '@/lib/data/gst-rates'

/**
 * Calculate similarity score between product text and HSN/SAC description
 * Uses simple word matching and keyword extraction
 */
function calculateSimilarity(
  productText: string,
  hsnDescription: string
): number {
  const productWords = productText
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2) // Ignore short words

  const hsnWords = hsnDescription
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2)

  if (productWords.length === 0 || hsnWords.length === 0) {
    return 0
  }

  // Count matching words
  let matches = 0
  for (const word of productWords) {
    if (hsnWords.some(hsnWord => hsnWord.includes(word) || word.includes(hsnWord))) {
      matches++
    }
  }

  // Calculate similarity score (0-1)
  const similarity = matches / Math.max(productWords.length, hsnWords.length)

  // Boost score if key words match exactly
  const exactMatches = productWords.filter(word =>
    hsnWords.includes(word)
  ).length

  return Math.min(1, similarity + (exactMatches * 0.2))
}

/**
 * Find best matching HSN/SAC code for a product
 * @param productName - Product name
 * @param description - Product description (optional)
 * @param itemType - Item type ('goods' or 'services')
 * @returns Best matching HSN/SAC code item with score, or null
 */
export function findBestHSNMatch(
  productName: string,
  description: string = '',
  itemType: 'goods' | 'services' = 'goods'
): { item: GSTRateItem; score: number } | null {
  if (!productName || productName.trim().length < 2) {
    return null
  }

  const searchText = `${productName} ${description}`.trim()

  // Search for matching codes
  const results = searchHSNCodes(searchText, itemType)

  if (results.length === 0) {
    return null
  }

  // Calculate similarity scores for each result
  const scoredResults = results.map(item => ({
    item,
    score: calculateSimilarity(searchText, item.description),
  }))

  // Sort by score (highest first)
  scoredResults.sort((a, b) => b.score - a.score)

  // Return the best match
  return scoredResults[0]
}

/**
 * Find top N matching HSN/SAC codes
 * @param productName - Product name
 * @param description - Product description (optional)
 * @param itemType - Item type ('goods' or 'services')
 * @param limit - Number of results to return (default: 5)
 * @returns Array of top matching HSN/SAC code items with scores
 */
export function findTopHSNMatches(
  productName: string,
  description: string = '',
  itemType: 'goods' | 'services' = 'goods',
  limit: number = 5
): Array<{ item: GSTRateItem; score: number }> {
  if (!productName || productName.trim().length < 2) {
    return []
  }

  const searchText = `${productName} ${description}`.trim()
  const results = searchHSNCodes(searchText, itemType)

  if (results.length === 0) {
    return []
  }

  // Calculate similarity scores
  const scoredResults = results.map(item => ({
    item,
    score: calculateSimilarity(searchText, item.description),
  }))

  // Sort by score and return top N
  scoredResults.sort((a, b) => b.score - a.score)

  return scoredResults.slice(0, limit)
}
