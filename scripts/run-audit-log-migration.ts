/**
 * Applies the AuditLog ipAddress/userAgent migration.
 * Run: npx tsx scripts/run-audit-log-migration.ts
 * Or ensure prisma/migrations/add_audit_log_ip_useragent.sql is run manually.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Applying AuditLog ipAddress/userAgent migration...')
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
    `)
    console.log('  - ipAddress column OK')
  } catch (e) {
    console.warn('  - ipAddress:', (e as Error).message)
  }
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
    `)
    console.log('  - userAgent column OK')
  } catch (e) {
    console.warn('  - userAgent:', (e as Error).message)
  }
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "AuditLog_ipAddress_idx" ON "AuditLog"("ipAddress");
    `)
    console.log('  - ipAddress index OK')
  } catch (e) {
    console.warn('  - Index:', (e as Error).message)
  }
  console.log('Done.')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
