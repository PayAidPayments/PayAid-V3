/**
 * Database optimization script
 * Run this to add indexes and optimize queries
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function optimizeDatabase() {
  console.log('Starting database optimization...')

  try {
    // Add indexes (using raw SQL since Prisma doesn't support all index types)
    const indexes = [
      // Contact indexes
      `CREATE INDEX IF NOT EXISTS "Contact_tenantId_createdAt_idx" ON "Contact"("tenantId", "createdAt" DESC)`,
      `CREATE INDEX IF NOT EXISTS "Contact_tenantId_status_idx" ON "Contact"("tenantId", "status")`,
      `CREATE INDEX IF NOT EXISTS "Contact_email_idx" ON "Contact"("email") WHERE "email" IS NOT NULL`,

      // Deal indexes
      `CREATE INDEX IF NOT EXISTS "Deal_tenantId_stage_idx" ON "Deal"("tenantId", "stage")`,
      `CREATE INDEX IF NOT EXISTS "Deal_tenantId_expectedCloseDate_idx" ON "Deal"("tenantId", "expectedCloseDate") WHERE "expectedCloseDate" IS NOT NULL`,
      `CREATE INDEX IF NOT EXISTS "Deal_tenantId_status_idx" ON "Deal"("tenantId", "status")`,

      // Interaction indexes
      `CREATE INDEX IF NOT EXISTS "Interaction_tenantId_contactId_createdAt_idx" ON "Interaction"("tenantId", "contactId", "createdAt" DESC)`,
      `CREATE INDEX IF NOT EXISTS "Interaction_tenantId_type_idx" ON "Interaction"("tenantId", "type")`,

      // Task indexes
      `CREATE INDEX IF NOT EXISTS "Task_tenantId_status_dueDate_idx" ON "Task"("tenantId", "status", "dueDate")`,
      `CREATE INDEX IF NOT EXISTS "Task_tenantId_assignedTo_idx" ON "Task"("tenantId", "assignedTo") WHERE "assignedTo" IS NOT NULL`,

      // Email indexes
      `CREATE INDEX IF NOT EXISTS "EmailMessage_tenantId_createdAt_idx" ON "EmailMessage"("tenantId", "createdAt" DESC)`,
      `CREATE INDEX IF NOT EXISTS "EmailMessage_contactId_idx" ON "EmailMessage"("contactId") WHERE "contactId" IS NOT NULL`,
    ]

    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index)
        console.log(`✓ Created index: ${index.split('"')[1]}`)
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`- Index already exists: ${index.split('"')[1]}`)
        } else {
          console.error(`✗ Failed to create index: ${error.message}`)
        }
      }
    }

    console.log('\nDatabase optimization complete!')
  } catch (error) {
    console.error('Error optimizing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

optimizeDatabase()
