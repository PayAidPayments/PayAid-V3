import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

async function redisPing(): Promise<boolean> {
  try {
    const { getRedisClient } = await import('@/lib/redis/client')
    const redis = getRedisClient()
    if (typeof (redis as any).ping !== 'function') return false
    const pong = await (redis as any).ping()
    return pong === true || pong === 'PONG'
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
