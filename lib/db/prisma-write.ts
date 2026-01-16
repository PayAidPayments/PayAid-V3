/**
 * Prisma Write Client (Primary Database)
 * 
 * Use this client for all write operations (POST, PATCH, DELETE).
 * This ensures data consistency and avoids replication lag issues.
 * 
 * For read operations, use prismaRead from prisma-read.ts
 */

// Re-export the primary Prisma client as prismaWrite for clarity
// In practice, you can use the regular prisma client for writes
export { prisma as prismaWrite } from './prisma'
