import { PrismaClient } from '@prisma/client'
import { isDevelopment, isProduction } from '@/lib/utils/env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Only log errors in production, disable query logging for performance
  log: isDevelopment()
    ? (process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'])
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (!isProduction()) {
  globalForPrisma.prisma = prisma
}

// Connection pooling configuration
// Prisma automatically uses connection pooling when DATABASE_URL includes ?pgbouncer=true
// For production, use a connection pooler like PgBouncer

export default prisma

