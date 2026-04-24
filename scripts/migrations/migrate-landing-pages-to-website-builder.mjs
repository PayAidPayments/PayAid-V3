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

function mapWebsiteGoalType(contentJson) {
  const goalType = contentJson?.websiteGoalType
  if (typeof goalType === 'string' && goalType.length > 0) return goalType
  return 'lead_generation'
}

function inferHomePage(contentJson, slug) {
  const schema = contentJson?.schema && typeof contentJson.schema === 'object' ? contentJson.schema : {}
  return {
    name: 'Home',
    slug: slug || 'home',
    pageType: 'home',
    navVisible: true,
    isHomepage: true,
    schemaJson: schema,
  }
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

  const records = landingPages.map((row) => {
    const contentJson = row.contentJson && typeof row.contentJson === 'object' ? row.contentJson : {}
    const homepage = inferHomePage(contentJson, row.slug)
    return {
      source: {
        landingPageId: row.id,
      },
      target: {
        websiteSite: {
          tenantId: row.tenantId,
          name: row.name,
          slug: row.slug,
          status: row.status,
          primaryGoal: mapWebsiteGoalType(contentJson),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
        websitePage: {
          name: homepage.name,
          slug: homepage.slug,
          pageType: homepage.pageType,
          status: row.status,
          navVisible: homepage.navVisible,
          isHomepage: homepage.isHomepage,
        },
        websitePageVersion: {
          versionNumber: 1,
          schemaJson: homepage.schemaJson,
          publishedSnapshotJson: row.status === 'PUBLISHED' ? homepage.schemaJson : null,
        },
      },
      metrics: {
        views: row.views,
        conversions: row.conversions,
        conversionRate: row.conversionRate?.toString?.() ?? null,
      },
    }
  })

  await fs.mkdir(outDir, { recursive: true })
  const artifactPath = path.join(outDir, `${nowStamp()}-landing-to-website-builder-dry-run.json`)
  await fs.writeFile(
    artifactPath,
    JSON.stringify(
      {
        mode: execute ? 'execute-not-implemented' : 'dry-run',
        tenantId: tenantId || null,
        total: records.length,
        notes: [
          'Canonical website_* tables are not merged in active Prisma schema yet.',
          'This script exports migration-ready transformed payloads from LandingPage.',
          'After canonical schema migration lands, add insert/upsert transaction for --execute mode.',
        ],
        records,
      },
      null,
      2
    ),
    'utf8'
  )

  console.log(`LandingPage rows found: ${records.length}`)
  console.log(`Dry-run artifact: ${artifactPath}`)
  if (execute) {
    console.log('Execute mode requested; canonical insert stage is not implemented yet.')
  }
}

main()
  .catch((error) => {
    console.error('Website Builder migration script failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
