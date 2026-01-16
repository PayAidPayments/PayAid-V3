/**
 * Auto-initialize Background Job Processors
 * This file is imported to automatically initialize job processors on server startup
 */

import { initializeJobProcessors } from './processors'
import { startCacheWarmingScheduler } from './scheduler'

let isInitialized = false

/**
 * Initialize background job processors and schedulers
 * Called automatically on server startup (server-side only)
 */
export function initializeBackgroundJobs() {
  if (isInitialized) {
    return
  }

  try {
    // Initialize job processors
    initializeJobProcessors()
    
    // Start cache warming scheduler
    startCacheWarmingScheduler()
    
    isInitialized = true
    console.log('✅ Background jobs initialized')
  } catch (error) {
    console.error('❌ Failed to initialize background jobs:', error)
    // Don't throw - allow app to continue even if initialization fails
  }
}

// Auto-initialize on import (server-side only)
if (typeof window === 'undefined') {
  // Initialize asynchronously to not block server startup
  initializeBackgroundJobs()
}
