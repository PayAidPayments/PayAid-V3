import Bull from 'bull'
import { getRedisConfig } from '@/lib/config/env'

/**
 * Parse Redis URL to extract connection options for Bull (ioredis).
 * Phase 1: Uses central config; prod must not use localhost.
 */
function parseRedisUrl(redisUrl: string): { host: string; port: number; password?: string } {
  try {
    const parsed = new URL(redisUrl)
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      password: parsed.password || undefined,
    }
  } catch {
    const parts = redisUrl.replace('redis://', '').split(':')
    return {
      host: parts[0] || 'localhost',
      port: parts[1] ? parseInt(parts[1], 10) : 6379,
    }
  }
}

function shouldEnableBull(): boolean {
  const config = getRedisConfig()
  const isBuildPhase = (process.env.NEXT_PHASE || '').includes('build')
  // Bull requires TCP Redis. Never attempt during build/static generation.
  if (isBuildPhase) return false
  return config.tcpAvailable
}

type MinimalQueue = Pick<Bull.Queue, 'add' | 'on' | 'close' | 'process'>

function createNoopQueue(name: string): MinimalQueue {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    add: async (_jobName: any, _data?: any, _opts?: any) => {
      // No-op in build/serverless environments without TCP Redis.
      return null as any
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    on: (_event: any, _handler: any) => createNoopQueue(name) as any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    process: (_jobName: any, _handler: any) => {
      // No-op when Bull is disabled (e.g. no REDIS_URL in dev).
      return undefined as any
    },
    close: async () => {},
  }
}

const redisConfig = parseRedisUrl(getRedisConfig().url)

// Create queues for different priority levels
export const highPriorityQueue: MinimalQueue = shouldEnableBull()
  ? new Bull('high-priority', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      },
    })
  : createNoopQueue('high-priority')

export const mediumPriorityQueue: MinimalQueue = shouldEnableBull()
  ? new Bull('medium-priority', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 200,
      },
    })
  : createNoopQueue('medium-priority')

export const lowPriorityQueue: MinimalQueue = shouldEnableBull()
  ? new Bull('low-priority', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 1,
        backoff: {
          type: 'fixed',
          delay: 10000,
        },
        removeOnComplete: 20,
        removeOnFail: 100,
      },
    })
  : createNoopQueue('low-priority')

// Queue event handlers
if (shouldEnableBull()) {
  ;(highPriorityQueue as Bull.Queue).on('completed', (job) => {
    console.log(`High priority job ${job.id} completed`)
  })

  ;(highPriorityQueue as Bull.Queue).on('failed', (job, err) => {
    console.error(`High priority job ${job?.id} failed:`, err)
  })

  ;(mediumPriorityQueue as Bull.Queue).on('completed', (job) => {
    console.log(`Medium priority job ${job.id} completed`)
  })

  ;(mediumPriorityQueue as Bull.Queue).on('failed', (job, err) => {
    console.error(`Medium priority job ${job?.id} failed:`, err)
  })

  ;(lowPriorityQueue as Bull.Queue).on('completed', (job) => {
    console.log(`Low priority job ${job.id} completed`)
  })

  ;(lowPriorityQueue as Bull.Queue).on('failed', (job, err) => {
    console.error(`Low priority job ${job?.id} failed:`, err)
  })
}

// Helper function to add jobs
export async function addJob(
  queue: MinimalQueue,
  jobName: string,
  data: any,
  options?: Bull.JobOptions
) {
  return (queue as any).add(jobName as any, data, options as any)
}

// Cleanup function
export async function closeQueues() {
  await highPriorityQueue.close()
  await mediumPriorityQueue.close()
  await lowPriorityQueue.close()
}

