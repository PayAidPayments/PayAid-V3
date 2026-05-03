/**
 * Auto-initialize Background Job Processors
 * This file is imported to automatically initialize job processors on server startup
 */

import { initializeJobProcessors } from './processors'
import { startCacheWarmingScheduler, startEmailCampaignScheduler } from './scheduler'
import { getRedisConfig, validateEnv } from '@/lib/config/env'

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
    // Jobs require Node runtime + TCP Redis (Bull). Skip in dev unless configured.
    if (process.env.NEXT_RUNTIME !== 'nodejs') return
    const env = validateEnv()
    const redis = getRedisConfig()
    if (!redis.tcpAvailable) {
      console.log('ℹ️  Bull disabled (no TCP Redis). Skipping job processors.')
      return
    }
    if (!env.ok) {
      console.log('ℹ️  Missing required env. Skipping job processors.')
      return
    }

    // Initialize job processors
    initializeJobProcessors()
    
    // Start cache warming scheduler
    startCacheWarmingScheduler()
    startEmailCampaignScheduler()
    
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
