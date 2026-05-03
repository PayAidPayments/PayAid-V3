/**
 * AI Influencer Marketing Module
 * Main entry point for initializing video generation queue processor
 */

// Export setup functions
export { initializeAIInfluencerModule, getDependencyStatus } from './setup'

// Export all services
export * from './video-templates'
export * from './face-detection'
export * from './lip-sync'
export * from './video-composer'
export * from './video-processor'
export * from './video-job-processor'

