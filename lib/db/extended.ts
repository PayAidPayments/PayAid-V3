// @ts-nocheck — Accelerate extension typings vs installed @prisma/client version.
/**
 * Phase 1: Prisma client with optional Accelerate extension.
 * Use for read-heavy, latency-sensitive queries (e.g. dashboards) when Accelerate is configured.
 * When DATABASE_URL starts with prisma:// or ACCELERATE_URL is set, returns extended client;
 * otherwise returns the same singleton as lib/db/prisma.
 */

import 'server-only'
import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

const accelerateUrl =
  typeof process !== 'undefined' &&
  (process.env.DATABASE_URL?.startsWith('prisma://') || process.env.ACCELERATE_URL)

const globalForExtended = globalThis as unknown as {
  prismaExtended: typeof prisma
}

function createExtendedClient(): typeof prisma {
  if (!accelerateUrl) return prisma
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { withAccelerate } = require('@prisma/extension-accelerate')
    const url =
      process.env.DATABASE_URL?.startsWith('prisma://')
        ? process.env.DATABASE_URL
        : process.env.ACCELERATE_URL
    if (!url) return prisma
    return new PrismaClient({ accelerateUrl: url }).$extends(withAccelerate()) as typeof prisma
  } catch (e) {
    console.warn('[db/extended] Accelerate extension not available, using base prisma:', (e as Error).message)
    return prisma
  }
}

/**
 * Prisma client with Accelerate extension when configured (prisma:// URL or ACCELERATE_URL).
 * Use for read-heavy queries with optional cacheStrategy: { ttl, swr }.
 */
export const prismaExtended =
  globalForExtended.prismaExtended ?? (globalForExtended.prismaExtended = createExtendedClient())

export default prismaExtended
