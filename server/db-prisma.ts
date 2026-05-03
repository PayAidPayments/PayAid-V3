/**
 * Standalone Prisma client for Node scripts and servers (e.g. websocket-voice-server).
 * Do NOT use in Next.js API routes or server components — use lib/db/prisma.ts there.
 * This file does not import 'server-only' so it can be run outside the Next.js bundle.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prismaStandalone: PrismaClient | undefined }

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL or DATABASE_DIRECT_URL must be set. Add it to .env when running standalone servers.'
    )
  }
  return url.trim()
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl()
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' && process.env.PRISMA_LOG_QUERIES === 'true'
      ? ['query', 'error', 'warn']
      : ['error'],
    datasources: { db: { url: databaseUrl } },
  })
}

export const prisma = globalForPrisma.prismaStandalone ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaStandalone = prisma
}
