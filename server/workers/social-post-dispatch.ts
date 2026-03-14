/**
 * Bull worker for social-post-dispatch jobs.
 * Run: npx tsx server/workers/social-post-dispatch.ts
 * Requires: REDIS_URL (or default localhost:6379), DATABASE_URL
 *
 * Processes jobs with name 'social-post-dispatch' and data { marketingPostId }.
 * Loads MarketingPost, calls the appropriate connector (WhatsApp/Email/etc.), updates status.
 */

import Bull from 'bull'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function getRedisUrl(): string {
  const url = process.env.REDIS_URL || 'redis://localhost:6379'
  return url.trim()
}

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

async function processSocialPostDispatch(job: Bull.Job<{ marketingPostId: string }>) {
  const { marketingPostId } = job.data
  const post = await prisma.marketingPost.findUnique({
    where: { id: marketingPostId },
  })
  if (!post) {
    console.warn(`[social-post-dispatch] MarketingPost not found: ${marketingPostId}`)
    return
  }
  if (post.status !== 'SCHEDULED') {
    console.warn(`[social-post-dispatch] Post ${marketingPostId} status is ${post.status}, skipping`)
    return
  }

  try {
    switch (post.channel) {
      case 'WHATSAPP':
        // TODO: wire WAHA connector – sendWhatsAppPost(post, config)
        // For now mark as SENT (or call your WAHA endpoint)
        await prisma.marketingPost.update({
          where: { id: post.id },
          data: { status: 'SENT', updatedAt: new Date() },
        })
        console.log(`[social-post-dispatch] WhatsApp post ${post.id} marked SENT (connector not wired)`)
        break
      case 'EMAIL':
        // TODO: use your SMTP/transporter and segment resolution
        await prisma.marketingPost.update({
          where: { id: post.id },
          data: { status: 'SENT', updatedAt: new Date() },
        })
        console.log(`[social-post-dispatch] Email post ${post.id} marked SENT (connector not wired)`)
        break
      case 'SMS':
      case 'FACEBOOK':
      case 'INSTAGRAM':
      case 'TWITTER':
      case 'LINKEDIN':
      case 'YOUTUBE':
      default:
        // Stub: mark as SENT until connectors are implemented
        await prisma.marketingPost.update({
          where: { id: post.id },
          data: { status: 'SENT', updatedAt: new Date() },
        })
        console.log(`[social-post-dispatch] Post ${post.id} (${post.channel}) marked SENT (stub)`)
        break
    }
  } catch (err) {
    console.error(`[social-post-dispatch] Failed for ${post.id}:`, err)
    await prisma.marketingPost.update({
      where: { id: post.id },
      data: {
        status: 'FAILED',
        metadata: {
          ...((post.metadata as object) || {}),
          error: err instanceof Error ? err.message : String(err),
        },
        updatedAt: new Date(),
      },
    })
    throw err
  }
}

async function main() {
  const redisConfig = parseRedisUrl(getRedisUrl())
  const queue = new Bull('medium-priority', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 50,
      removeOnFail: 200,
    },
  })

  queue.process(async (job: Bull.Job<{ marketingPostId?: string }>) => {
    if (job.data?.marketingPostId) {
      await processSocialPostDispatch(job as Bull.Job<{ marketingPostId: string }>)
    }
  })

  queue.on('completed', (job) => {
    console.log(`[social-post-dispatch] Job ${job.id} completed`)
  })
  queue.on('failed', (job, err) => {
    console.error(`[social-post-dispatch] Job ${job?.id} failed:`, err)
  })

  console.log('[social-post-dispatch] Worker listening on queue "medium-priority" for jobs with marketingPostId')
}

main().catch((err) => {
  console.error('[social-post-dispatch] Fatal:', err)
  process.exit(1)
})
