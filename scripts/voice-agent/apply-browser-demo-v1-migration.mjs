#!/usr/bin/env node
/**
 * Idempotent apply of browser demo v1 DB objects (no Vercel redeploy).
 * Uses DATABASE_URL from .env.local — must match voice production DB.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })
dotenv.config({ quiet: true })

const sqlPath = path.join(
  process.cwd(),
  'packages/db/prisma/migrations/20260516123000_voice_browser_demo_v1/migration.sql',
)
const sql = readFileSync(sqlPath, 'utf8')
const statements = sql
  .split(';')
  .map((s) =>
    s
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim(),
  )
  .filter((s) => s.length > 0)

const prisma = new PrismaClient()
const results = []
try {
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(`${stmt};`)
      results.push({ ok: true, stmt: stmt.slice(0, 72) })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const benign =
        msg.includes('already exists') ||
        msg.includes('duplicate') ||
        (msg.includes('column') && msg.includes('already exists'))
      results.push({ ok: benign, stmt: stmt.slice(0, 72), error: benign ? 'skipped' : msg })
      if (!benign) throw e
    }
  }
  console.log(JSON.stringify({ ok: true, results }, null, 2))
} catch (e) {
  console.error(JSON.stringify({ ok: false, results, error: e instanceof Error ? e.message : String(e) }, null, 2))
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
