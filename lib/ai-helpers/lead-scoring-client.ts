/**
 * Client-Safe Lead Scoring Utilities
 * Pure functions that don't require database access
 * Safe to use in client components
 */

/**
 * Get score category (Hot, Warm, Cold)
 * @param score - Lead score (0-100)
 * @returns Category and color
 */
export function getScoreCategory(score: number): {
  category: 'hot' | 'warm' | 'cold'
  color: string
  icon: string
  label: string
} {
  if (score >= 70) {
    return {
      category: 'hot',
      color: 'text-green-600 bg-green-50',
      icon: '🔥',
      label: 'Hot',
    }
  } else if (score >= 40) {
    return {
      category: 'warm',
      color: 'text-yellow-600 bg-yellow-50',
      icon: '⚠️',
      label: 'Warm',
    }
  } else {
    return {
      category: 'cold',
      color: 'text-gray-600 bg-gray-50',
      icon: '❄️',
      label: 'Cold',
    }
  }
}

