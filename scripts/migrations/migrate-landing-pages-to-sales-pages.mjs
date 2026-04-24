#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function getArg(name, fallback = '') {
  const prefix = `--${name}=`
  const item = process.argv.find((arg) => arg.startsWith(prefix))
  return item ? item.slice(prefix.length) : fallback
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function mapPageType(contentJson) {
  const pageType = contentJson?.pageType
  if (typeof pageType === 'string' && pageType.length > 0) return pageType
  return 'lead_capture'
}

function mapGoalType(contentJson) {
  const goalType = contentJson?.goalType
  if (typeof goalType === 'string' && goalType.length > 0) return goalType
  return 'form_submit'
}

async function main() {
  const tenantId = getArg('tenantId')
  const outDir = getArg('outDir', path.resolve('docs', 'evidence', 'migrations'))
  const execute = process.argv.includes('--execute')

  const where = tenantId ? { tenantId } : {}
  const landingPages = await prisma.landingPage.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  })

  const mapped = landingPages.map((row, index) => {
    const contentJson = row.contentJson && typeof row.contentJson === 'object' ? row.contentJson : {}
    return {
      source: {
        landingPageId: row.id,
      },
      target: {
        // IDs intentionally omitted for canonical insert stage
        tenantId: row.tenantId,
        name: row.name,
        slug: row.slug,
        type: mapPageType(contentJson),
        goal: mapGoalType(contentJson),
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      version: {
        versionNumber: 1,
        schemaJson: contentJson?.schema ?? contentJson,
        publishedSnapshotJson: row.status === 'PUBLISHED' ? contentJson : null,
      },
      metrics: {
        views: row.views,
        conversions: row.conversions,
        conversionRate: row.conversionRate?.toString?.() ?? null,
      },
      order: index + 1,
    }
  })

  await fs.mkdir(outDir, { recursive: true })
  const artifactPath = path.join(outDir, `${nowStamp()}-landing-to-sales-pages-dry-run.json`)
  await fs.writeFile(
    artifactPath,
    JSON.stringify(
      {
        mode: execute ? 'execute-not-implemented' : 'dry-run',
        tenantId: tenantId || null,
        total: mapped.length,
        notes: [
          'Canonical sales_* tables are not created in Prisma schema yet.',
          'This script currently exports migration-ready transformed payloads.',
          'After canonical migration lands, add insert/upsert transaction in --execute mode.',
        ],
        records: mapped,
      },
      null,
      2
    ),
    'utf8'
  )

  console.log(`LandingPage rows found: ${mapped.length}`)
  console.log(`Dry-run artifact: ${artifactPath}`)
  if (execute) {
    console.log('Execute mode requested; canonical insert stage is not implemented yet.')
  }
}

main()
  .catch((error) => {
    console.error('Migration script failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
