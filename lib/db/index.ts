/**
 * Central DB exports. Use prisma for general access; use prismaExtended for read-heavy
 * paths when ACCELERATE_URL (or prisma:// DATABASE_URL) is set (cache/edge).
 */
import 'server-only'

export { prisma } from './prisma'
export { prismaExtended } from './extended'
export { prismaWithRetry } from './connection-retry'
