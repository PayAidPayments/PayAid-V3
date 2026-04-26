import { prisma } from '@/lib/db/prisma'

let ensureLogoSchemaPromise: Promise<void> | null = null

/**
 * Backward-compatible guard for environments where Logo.logoType was not migrated yet.
 * This keeps logo APIs operational while proper migrations are being rolled out.
 */
export async function ensureLogoSchemaCompatibility(): Promise<void> {
  if (!ensureLogoSchemaPromise) {
    ensureLogoSchemaPromise = ensureLogoSchemaCompatibilityInternal().catch((error) => {
      ensureLogoSchemaPromise = null
      throw error
    })
  }
  await ensureLogoSchemaPromise
}

async function ensureLogoSchemaCompatibilityInternal(): Promise<void> {
  await ensureLogoTypeColumn()
  await ensureLogoVariationVectorColumns()
}

async function ensureLogoTypeColumn(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe('SELECT "logoType" FROM "Logo" LIMIT 1')
    return
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const missingLogoTypeColumn = /column\s+["']?logotype["']?\s+does not exist/i.test(message)
    const missingTable = /relation\s+["']?Logo["']?\s+does not exist/i.test(message)

    if (missingTable) {
      throw new Error(
        'Logo table is missing in the current database. Run Prisma migrations before using the logo generator.'
      )
    }

    if (!missingLogoTypeColumn) {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogoType') THEN
          CREATE TYPE "LogoType" AS ENUM ('VECTOR', 'AI_IMAGE');
        END IF;
      END $$;
    `)

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Logo"
      ADD COLUMN IF NOT EXISTS "logoType" "LogoType" NOT NULL DEFAULT 'VECTOR';
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Logo_tenantId_logoType_idx"
      ON "Logo" ("tenantId", "logoType");
    `)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Logo schema mismatch detected (missing "Logo"."logoType") and automatic repair failed. ` +
        `Apply Prisma migrations on this environment. Details: ${message}`
    )
  }
}

async function ensureLogoVariationVectorColumns(): Promise<void> {
  try {
    await prisma.$queryRawUnsafe('SELECT "svgData" FROM "LogoVariation" LIMIT 1')
    return
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const missingSvgDataColumn = /column\s+["']?svgdata["']?\s+does not exist/i.test(message)
    const missingTable = /relation\s+["']?LogoVariation["']?\s+does not exist/i.test(message)

    if (missingTable) {
      throw new Error(
        'LogoVariation table is missing in the current database. Run Prisma migrations before using the vector logo generator.'
      )
    }

    if (!missingSvgDataColumn) {
      throw error
    }
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "LogoVariation"
      ADD COLUMN IF NOT EXISTS "svgData" TEXT,
      ADD COLUMN IF NOT EXISTS "fontFamily" TEXT,
      ADD COLUMN IF NOT EXISTS "fontSize" INTEGER,
      ADD COLUMN IF NOT EXISTS "textColor" TEXT,
      ADD COLUMN IF NOT EXISTS "gradient" JSONB,
      ADD COLUMN IF NOT EXISTS "shadow" JSONB,
      ADD COLUMN IF NOT EXISTS "outline" JSONB,
      ADD COLUMN IF NOT EXISTS "animation" TEXT,
      ADD COLUMN IF NOT EXISTS "background" JSONB,
      ADD COLUMN IF NOT EXISTS "layout" JSONB,
      ADD COLUMN IF NOT EXISTS "layoutConfig" JSONB,
      ADD COLUMN IF NOT EXISTS "size" INTEGER;
    `)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Logo schema mismatch detected (missing vector columns on "LogoVariation") and automatic repair failed. ` +
        `Apply Prisma migrations on this environment. Details: ${message}`
    )
  }
}
