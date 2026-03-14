/**
 * @payaid/db – Prisma with optional Accelerate extension.
 */

import 'server-only'
import { prisma } from './client'

const accelerateUrl =
  typeof process !== 'undefined' &&
  (process.env.DATABASE_URL?.startsWith('prisma://') || process.env.ACCELERATE_URL)

const globalForExtended = globalThis as unknown as { prismaExtended: typeof prisma }

function createExtendedClient(): typeof prisma {
  if (!accelerateUrl) return prisma
  try {
    const { withAccelerate } = require('@prisma/extension-accelerate')
    const { PrismaClient } = require('@prisma/client')
    const url =
      process.env.DATABASE_URL?.startsWith('prisma://')
        ? process.env.DATABASE_URL
        : process.env.ACCELERATE_URL
    if (!url) return prisma
    return new PrismaClient({ accelerateUrl: url }).$extends(withAccelerate()) as typeof prisma
  } catch (e) {
    console.warn('[payaid/db] Accelerate not available:', (e as Error).message)
    return prisma
  }
}

export const prismaExtended =
  globalForExtended.prismaExtended ?? (globalForExtended.prismaExtended = createExtendedClient())

export default prismaExtended
