/**
 * Preview-only queue module — no `bull` package import.
 * Written over lib/queue/bull.ts during git-vercel builds.
 */
// @ts-nocheck

import { validateQueueJobPayload } from '@/lib/queue/contracts'

type MinimalQueue = {
  add: (jobName: any, data?: any, opts?: any) => Promise<any>
  on: (event: any, handler: any) => MinimalQueue
  process: (jobName: any, handler: any) => any
  close: () => Promise<void>
}

function createNoopQueue(_name: string): MinimalQueue {
  const queue: MinimalQueue = {
    add: async () => null,
    on() {
      return queue
    },
    process() {
      return undefined
    },
    close: async () => undefined,
  }
  return queue
}

export const highPriorityQueue = createNoopQueue('high-priority')
export const mediumPriorityQueue = createNoopQueue('medium-priority')
export const lowPriorityQueue = createNoopQueue('low-priority')

export async function addJob(queue: MinimalQueue, jobName: string, data: any, options?: any) {
  validateQueueJobPayload(jobName, data)
  return queue.add(jobName as any, data, options as any)
}

export async function closeQueues() {
  await highPriorityQueue.close()
  await mediumPriorityQueue.close()
  await lowPriorityQueue.close()
}
