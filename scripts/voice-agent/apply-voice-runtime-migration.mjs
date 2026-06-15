#!/usr/bin/env node
/**
 * Apply only the Bolna voice runtime columns (idempotent).
 * Use when full `prisma migrate deploy` is blocked on unrelated pending migrations.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config({ path: path.join(process.cwd(), '.env.local'), quiet: true })
dotenv.config({ quiet: true })

const sqlPath = path.join(
  process.cwd(),
  'packages/db/prisma/migrations/20260605120000_voice_agent_realtime_runtime/migration.sql',
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
const applied = []
try {
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(`${stmt};`)
      applied.push({ stmt: stmt.slice(0, 80), ok: true })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      applied.push({ stmt: stmt.slice(0, 80), ok: false, error: msg })
      throw e
    }
  }
  console.log(JSON.stringify({ ok: true, applied }, null, 2))
} catch (e) {
  console.error(JSON.stringify({ ok: false, applied, error: e instanceof Error ? e.message : String(e) }, null, 2))
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
