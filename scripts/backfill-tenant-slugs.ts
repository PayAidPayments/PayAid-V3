/**
 * Backfill Tenant.slug for existing tenants using generateTenantSlug(tenant.name).
 * Run: npx tsx scripts/backfill-tenant-slugs.ts
 * Requires: migration add_tenant_slug applied (Tenant.slug column exists).
 */

import { config } from 'dotenv'
config()

import { PrismaClient } from '@prisma/client'
import { generateTenantSlug } from '../lib/utils/generate-tenant-slug'

const prisma = new PrismaClient()

const MAX_ATTEMPTS = 5

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  })
  console.log(`[backfill-tenant-slugs] Found ${tenants.length} tenant(s) without slug.`)

  const existingSlugs = new Set(
    (await prisma.tenant.findMany({ where: { slug: { not: null } }, select: { slug: true } }))
      .map((t) => t.slug as string)
  )

  let updated = 0
  let failed = 0

  for (const tenant of tenants) {
    let slug: string | null = null
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const candidate = generateTenantSlug(tenant.name)
      if (!existingSlugs.has(candidate)) {
        slug = candidate
        break
      }
    }
    if (!slug) {
      const base = generateTenantSlug(tenant.name).replace(/\d{4}$/, '')
      slug = `${base}${Math.floor(1000 + Math.random() * 9000)}`
    }

    try {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { slug },
      })
      existingSlugs.add(slug)
      updated++
      console.log(`  ${tenant.name} → ${slug}`)
    } catch (e) {
      failed++
      console.error(`  FAIL ${tenant.name}:`, e instanceof Error ? e.message : e)
    }
  }

  console.log(`[backfill-tenant-slugs] Done. Updated: ${updated}, Failed: ${failed}.`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
