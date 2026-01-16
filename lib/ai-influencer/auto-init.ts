/**
 * Auto-initialize AI Influencer Marketing module
 * This file is imported to automatically initialize the module
 */

import { initializeAIInfluencerModule } from './setup'

// Auto-initialize on import (server-side only)
if (typeof window === 'undefined') {
  // Initialize asynchronously to not block server startup
  initializeAIInfluencerModule().catch((error) => {
    console.error('Failed to auto-initialize AI Influencer Marketing:', error)
  })
}

