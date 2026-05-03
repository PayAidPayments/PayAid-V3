#!/usr/bin/env tsx
/**
 * Database Migration: Add Vector Logo Support
 * 
 * This script migrates existing AI-generated logos to the new schema
 * that supports both VECTOR and AI_IMAGE types.
 * 
 * Run: npx tsx scripts/migrate-logos-to-typed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting logo migration...\n')

  try {
    // 1. Count existing logos
    const totalLogos = await prisma.logo.count()
    console.log(`📊 Found ${totalLogos} existing logos`)

    if (totalLogos === 0) {
      console.log('✅ No logos to migrate')
      return
    }

    // 2. Mark all existing logos as AI_IMAGE type.
    // This script is intended to run once, before vector logos are created.
    console.log('\n🔄 Migrating existing logos to AI_IMAGE type...')

    const result = await prisma.logo.updateMany({
      data: {
        logoType: 'AI_IMAGE',
      },
    })

    console.log(`✅ Migrated ${result.count} logos to AI_IMAGE type`)

    // 3. Verify migration
    console.log('\n🔍 Verifying migration...')
    
    const aiLogos = await prisma.logo.count({
      where: { logoType: 'AI_IMAGE' },
    })
    
    const vectorLogos = await prisma.logo.count({
      where: { logoType: 'VECTOR' },
    })

    console.log(`📊 Logo types after migration:`)
    console.log(`   - AI_IMAGE: ${aiLogos}`)
    console.log(`   - VECTOR: ${vectorLogos}`)
    console.log(`   - TOTAL: ${aiLogos + vectorLogos}`)

    // 4. Check for any unmigrated logos
    const unmigrated = totalLogos - (aiLogos + vectorLogos)
    if (unmigrated > 0) {
      console.warn(`⚠️  Warning: ${unmigrated} logos were not migrated`)
    } else {
      console.log('\n✅ Migration completed successfully!')
    }

    // 5. Display sample data
    console.log('\n📝 Sample migrated logos:')
    const samples = await prisma.logo.findMany({
      take: 3,
      select: {
        id: true,
        businessName: true,
        logoType: true,
        status: true,
        _count: {
          select: { variations: true }
        }
      }
    })

    samples.forEach((logo, i) => {
      console.log(`   ${i + 1}. ${logo.businessName} (${logo.logoType}) - ${logo._count.variations} variations`)
    })

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
