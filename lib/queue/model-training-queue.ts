/**
 * Bull Queue for Model Training and Deployment Jobs
 */

import Queue from 'bull'
import { processTrainingJob, processDeploymentJob } from '@/lib/jobs/model-training-processor'

// Redis connection URL
const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379'

/**
 * Create training queue
 */
export function getTrainingQueue() {
  return new Queue('model-training', REDIS_URL, {
    defaultJobOptions: {
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 50, // Keep last 50 failed jobs
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  })
}

/**
 * Create deployment queue
 */
export function getDeploymentQueue() {
  return new Queue('model-deployment', REDIS_URL, {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  })
}

/**
 * Setup queue processors
 */
export function setupModelTrainingProcessors() {
  const trainingQueue = getTrainingQueue()
  const deploymentQueue = getDeploymentQueue()

  // Process training jobs
  trainingQueue.process('train-model', async (job) => {
    return await processTrainingJob(job)
  })

  // Process deployment jobs
  deploymentQueue.process('deploy-model', async (job) => {
    return await processDeploymentJob(job)
  })

  // Log job events
  trainingQueue.on('completed', (job, result) => {
    console.log(`[Training Queue] Job ${job.id} completed:`, result)
  })

  trainingQueue.on('failed', (job, err) => {
    console.error(`[Training Queue] Job ${job?.id} failed:`, err)
  })

  deploymentQueue.on('completed', (job, result) => {
    console.log(`[Deployment Queue] Job ${job.id} completed:`, result)
  })

  deploymentQueue.on('failed', (job, err) => {
    console.error(`[Deployment Queue] Job ${job?.id} failed:`, err)
  })

  return { trainingQueue, deploymentQueue }
}

// Auto-setup if this module is imported
if (process.env.NODE_ENV !== 'test') {
  setupModelTrainingProcessors()
}
