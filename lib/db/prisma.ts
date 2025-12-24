import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Only log errors in production, disable query logging for performance
  log: process.env.NODE_ENV === 'development' 
    ? (process.env.PRISMA_LOG_QUERIES === 'true' ? ['query', 'error', 'warn'] : ['error', 'warn'])
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Connection pooling configuration
// Prisma automatically uses connection pooling when DATABASE_URL includes ?pgbouncer=true
// For production, use a connection pooler like PgBouncer

export default prisma

