import Bull from 'bull'
import { getRedisClient } from '../redis/client'

// Queue configuration
const redisClient = getRedisClient()

// Create queues for different priority levels
export const highPriorityQueue = new Bull('high-priority', {
  redis: {
    host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost',
    port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
  },
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

export const mediumPriorityQueue = new Bull('medium-priority', {
  redis: {
    host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost',
    port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
  },
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

export const lowPriorityQueue = new Bull('low-priority', {
  redis: {
    host: process.env.REDIS_URL?.replace('redis://', '').split(':')[0] || 'localhost',
    port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
  },
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

// Queue event handlers
highPriorityQueue.on('completed', (job) => {
  console.log(`High priority job ${job.id} completed`)
})

highPriorityQueue.on('failed', (job, err) => {
  console.error(`High priority job ${job.id} failed:`, err)
})

mediumPriorityQueue.on('completed', (job) => {
  console.log(`Medium priority job ${job.id} completed`)
})

mediumPriorityQueue.on('failed', (job, err) => {
  console.error(`Medium priority job ${job.id} failed:`, err)
})

lowPriorityQueue.on('completed', (job) => {
  console.log(`Low priority job ${job.id} completed`)
})

lowPriorityQueue.on('failed', (job, err) => {
  console.error(`Low priority job ${job.id} failed:`, err)
})

// Helper function to add jobs
export async function addJob(
  queue: Bull.Queue,
  jobName: string,
  data: any,
  options?: Bull.JobOptions
) {
  return queue.add(jobName, data, options)
}

// Cleanup function
export async function closeQueues() {
  await highPriorityQueue.close()
  await mediumPriorityQueue.close()
  await lowPriorityQueue.close()
}

