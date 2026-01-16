/**
 * Background Job Processor for Video Generation
 * Processes video generation jobs from Bull queue
 */

import { mediumPriorityQueue } from '@/lib/queue/bull'
import { processVideoGeneration, VideoGenerationParams } from './video-processor'
import { prisma } from '@/lib/db/prisma'

/**
 * Process video generation job
 */
export async function processVideoGenerationJob(job: any) {
  const { videoId, tenantId, characterId, scriptId, style, cta } = job.data as VideoGenerationParams

  console.log(`🎬 Starting video generation for video ${videoId}`)

  try {
    const videoPath = await processVideoGeneration({
      videoId,
      tenantId,
      characterId,
      scriptId,
      style,
      cta,
    })

    console.log(`✅ Video generation complete: ${videoPath}`)
    
    return {
      success: true,
      videoPath,
    }
  } catch (error) {
    console.error(`❌ Video generation failed for ${videoId}:`, error)
    throw error
  }
}

/**
 * Setup queue processor
 */
export function setupVideoGenerationProcessor() {
  mediumPriorityQueue.process('generate-ai-influencer-video', async (job) => {
    return await processVideoGenerationJob(job)
  })

  console.log('✅ Video generation queue processor started')
}

/**
 * Add video generation job to queue
 */
export async function queueVideoGeneration(params: VideoGenerationParams) {
  const job = await mediumPriorityQueue.add('generate-ai-influencer-video', params, {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  })

  return job
}

