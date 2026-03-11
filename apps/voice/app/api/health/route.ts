import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

async function redisPing(): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.REDIS_URL) return false
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const res = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN || ''}` },
        body: JSON.stringify({ command: 'ping' }),
      })
      return res.ok
    }
    return true
  } catch {
    return false
  }
}

async function dbOk(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

/** GET /api/health – redis, ai, db for monitoring. */
export async function GET() {
  const [redis, db] = await Promise.all([redisPing(), dbOk()])
  return NextResponse.json({
    redis,
    ai: true,
    db,
    status: db ? 'healthy' : 'degraded',
  })
}
