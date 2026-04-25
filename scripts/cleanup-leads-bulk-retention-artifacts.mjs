#!/usr/bin/env node
import { mkdirSync, readdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { isStrictFlagEnabled } from './strict-flag.mjs'

const root = process.cwd()
const closureDir = join(root, 'docs', 'evidence', 'closure')
const markersDir = join(closureDir, 'markers')
const archiveRootDir = join(closureDir, 'archive')
const retentionDays = Number(process.env.LEADS_BULK_RETENTION_ARTIFACT_RETENTION_DAYS || 14)
const apply = isStrictFlagEnabled(process.env.LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_APPLY)
const mode = (process.env.LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_MODE || 'delete').toLowerCase()
const includeMarkers = isStrictFlagEnabled(process.env.LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_INCLUDE_MARKERS)
const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000

const timestampedPatterns = [
  /-leads-bulk-retention-scheduler-health\.(json|md)$/i,
  /-leads-bulk-retention-closure-pack\.(json|md)$/i,
]

const keepExactNames = new Set([
  'latest-leads-bulk-retention-scheduler-health.md',
])

function shouldConsider(name) {
  if (keepExactNames.has(name)) return false
  return timestampedPatterns.some((re) => re.test(name))
}

function collectCandidates(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    if (!shouldConsider(name)) continue
    const filePath = join(dir, name)
    const st = statSync(filePath)
    if (!st.isFile()) continue
    if (st.mtimeMs < cutoffMs) {
      out.push({
        path: filePath,
        name,
        mtime: new Date(st.mtimeMs).toISOString(),
      })
    }
  }
  return out
}

function collectMarkerCandidates(dir) {
  if (!includeMarkers) return []
  const out = []
  let names = []
  try {
    names = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of names) {
    if (name !== 'leads-bulk-retention-health-gate-green.json') continue
    const filePath = join(dir, name)
    const st = statSync(filePath)
    if (!st.isFile()) continue
    if (st.mtimeMs < cutoffMs) {
      out.push({
        path: filePath,
        name,
        mtime: new Date(st.mtimeMs).toISOString(),
      })
    }
  }
  return out
}

let candidates = []
try {
  candidates = [...collectCandidates(closureDir), ...collectMarkerCandidates(markersDir)]
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Failed to scan closure directory',
        closureDir,
        details: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const deleted = []
const archived = []
if (apply) {
  for (const item of candidates) {
    try {
      if (mode === 'archive') {
        const monthBucket = item.mtime.slice(0, 7)
        const targetDir = join(archiveRootDir, monthBucket)
        mkdirSync(targetDir, { recursive: true })
        const targetPath = join(targetDir, item.name)
        renameSync(item.path, targetPath)
        archived.push({ from: item.path, to: targetPath })
      } else {
        unlinkSync(item.path)
        deleted.push(item.path)
      }
    } catch (error) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            error: 'Failed deleting artifact',
            path: item.path,
            details: error instanceof Error ? error.message : String(error),
          },
          null,
          2,
        ),
      )
      process.exit(1)
    }
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      apply,
      mode,
      includeMarkers,
      retentionDays,
      scannedDir: closureDir,
      candidateCount: candidates.length,
      deletedCount: deleted.length,
      archivedCount: archived.length,
      candidates: candidates.map((c) => ({ path: c.path, mtime: c.mtime })),
      archived,
      nextSteps: apply
        ? [
            mode === 'archive'
              ? 'Archive applied. Re-run dry-run to confirm zero candidates.'
              : 'Cleanup applied. Re-run dry-run to confirm zero candidates.',
          ]
        : [
            'Dry run only. To apply cleanup:',
            '$env:LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_APPLY="1"',
            '$env:LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_MODE="archive"  # or "delete"',
            '$env:LEADS_BULK_RETENTION_ARTIFACT_CLEANUP_INCLUDE_MARKERS="1"  # optional',
            'npm run cleanup:leads-bulk-retention-artifacts',
          ],
    },
    null,
    2,
  ),
)
