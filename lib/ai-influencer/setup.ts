/**
 * AI Influencer Marketing Setup
 * Initialize queue processor and check dependencies
 */

import { setupVideoGenerationProcessor } from './video-job-processor'
import { checkFFmpegInstalled } from './video-composer'
import { checkRhubarbInstalled } from './lip-sync'
import { checkTemplatesAvailable, getTemplateStatusMessage } from './template-fallback'

let isInitialized = false

/**
 * Initialize AI Influencer Marketing module
 * Call this during app startup (server-side only)
 */
export async function initializeAIInfluencerModule() {
  if (isInitialized) {
    return
  }

  try {
    // Setup queue processor
    setupVideoGenerationProcessor()
    console.log('✅ AI Influencer video generation queue processor started')

    // Check dependencies
    await checkDependencies()

    isInitialized = true
  } catch (error) {
    console.error('❌ Failed to initialize AI Influencer Marketing module:', error)
    // Don't throw - allow app to continue even if initialization fails
  }
}

/**
 * Check if required dependencies are installed
 */
async function checkDependencies() {
  const checks = {
    ffmpeg: false,
    rhubarb: false,
    templates: { available: 0, total: 0, missing: [] as string[] },
  }

  // Check FFmpeg
  try {
    await checkFFmpegInstalled()
    checks.ffmpeg = true
    console.log('✅ FFmpeg is installed')
  } catch (error) {
    console.warn('⚠️ FFmpeg is not installed. Video generation will fail.')
    console.warn('   Install from: https://ffmpeg.org/download.html')
  }

  // Check Rhubarb (optional)
  try {
    checks.rhubarb = await checkRhubarbInstalled()
    if (checks.rhubarb) {
      console.log('✅ Rhubarb Lip Sync is installed')
    } else {
      console.warn('⚠️ Rhubarb Lip Sync is not installed. Using placeholder lip-sync.')
      console.warn('   Download from: https://github.com/DanielSWolf/rhubarb-lip-sync/releases')
    }
  } catch (error) {
    console.warn('⚠️ Could not check Rhubarb installation')
  }

  // Check templates
  checks.templates = checkTemplatesAvailable()
  const templateStatus = getTemplateStatusMessage()
  console.log(templateStatus.split('\n')[0]) // Log first line only
  if (checks.templates.available < checks.templates.total) {
    console.warn('   Missing templates:', checks.templates.missing.join(', '))
  }

  return checks
}

/**
 * Get dependency status
 */
export async function getDependencyStatus() {
  return await checkDependencies()
}

