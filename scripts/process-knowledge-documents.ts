/**
 * Script to process knowledge documents
 * 
 * This script sets up the Bull queue processor for knowledge documents
 * Run this as a separate worker process or in a cron job
 * 
 * Usage:
 *   npx tsx scripts/process-knowledge-documents.ts
 */

import { mediumPriorityQueue } from '@/lib/queue/bull'
import { processKnowledgeDocument } from '@/lib/background-jobs/process-knowledge-document'

// Process jobs from the queue
mediumPriorityQueue.process('process-knowledge-document', async (job) => {
  const { documentId, tenantId } = job.data
  return await processKnowledgeDocument({ documentId, tenantId })
})

console.log('Knowledge document processor started. Waiting for jobs...')

// Handle job events
mediumPriorityQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result)
})

mediumPriorityQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err)
})

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing queue...')
  await mediumPriorityQueue.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing queue...')
  await mediumPriorityQueue.close()
  process.exit(0)
})

