#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const closureDir = join(root, 'docs', 'evidence', 'closure')
const markersDir = join(closureDir, 'markers')
const archiveRootDir = join(closureDir, 'archive')
const markerMutationApprovalFile = join(markersDir, 'ALLOW_MARKER_MUTATION')

const retentionDays = Number(process.env.MARKETING_RELEASE_ARTIFACT_RETENTION_DAYS || 7)
const apply = process.env.MARKETING_RELEASE_CLEANUP_APPLY === '1'
const mode = (process.env.MARKETING_RELEASE_CLEANUP_MODE || 'delete').toLowerCase()
const includeMarkers = process.env.MARKETING_RELEASE_CLEANUP_INCLUDE_MARKERS === '1'
const allowMarkerMutationByEnv = process.env.MARKETING_RELEASE_CLEANUP_ALLOW_MARKER_MUTATION === '1'
const allowMarkerMutationByFilePresent = existsSync(markerMutationApprovalFile)

function parseApprovalExpiry(path) {
  try {
    const raw = readFileSync(path, 'utf8')
    const line = raw
      .split(/\r?\n/)
      .find((l) => l.trim().toLowerCase().startsWith('expiresat='))
    if (!line) return null
    const value = line.split('=').slice(1).join('=').trim()
    const ms = Date.parse(value)
    if (!Number.isFinite(ms)) return null
    return { raw: value, ms }
  } catch {
    return null
  }
}

const approvalExpiry = allowMarkerMutationByFilePresent
  ? parseApprovalExpiry(markerMutationApprovalFile)
  : null
const approvalNotExpired = approvalExpiry ? Date.now() <= approvalExpiry.ms : false
const allowMarkerMutationByFile = allowMarkerMutationByFilePresent && approvalNotExpired
const allowMarkerMutation = allowMarkerMutationByEnv && allowMarkerMutationByFile
const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000

const timestampedPatterns = [
  /-social-oauth-smoke\.(json|md)$/i,
  /-marketing-release-closure-pack\.md$/i,
]

const keepExactNames = new Set([
  'latest-social-oauth-smoke.md',
  'latest-social-oauth-smoke-handoff-snippet.md',
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
  const out = []
  const activeMarkerName = 'marketing-release-gate-green.json'
  let names = []
  try {
    names = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of names) {
    if (name !== activeMarkerName) continue
    const filePath = join(dir, name)
    const st = statSync(filePath)
    if (!st.isFile()) continue
    if (st.mtimeMs < cutoffMs) {
      out.push({
        path: filePath,
        name,
        mtime: new Date(st.mtimeMs).toISOString(),
        marker: true,
      })
    }
  }
  return out
}

let candidates = []
let markerCandidatesSkippedBySafety = 0
try {
  candidates = collectCandidates(closureDir)
  if (includeMarkers) {
    const markerCandidates = collectMarkerCandidates(markersDir)
    if (allowMarkerMutation) {
      candidates = [...candidates, ...markerCandidates]
    } else {
      markerCandidatesSkippedBySafety = markerCandidates.length
    }
  }
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
      2
    )
  )
  process.exit(1)
}

const markerStatus = {
  markersDir,
  exists: false,
  includeMarkers,
  allowMarkerMutationByEnv,
  approvalFilePresent: allowMarkerMutationByFilePresent,
  allowMarkerMutationByFile,
  approvalExpiresAt: approvalExpiry?.raw || null,
  approvalExpired: allowMarkerMutationByFilePresent ? !approvalNotExpired : null,
  allowMarkerMutation,
  skippedBySafety: markerCandidatesSkippedBySafety,
  note: includeMarkers
    ? allowMarkerMutation
      ? 'Marker cleanup enabled and mutation explicitly allowed.'
      : 'Marker cleanup requested but dual-control safety lock is active (need env flag + unexpired approval file); marker candidates are skipped.'
    : 'No marker cleanup performed (single deterministic marker file retained).',
  approvalFile: markerMutationApprovalFile,
}
try {
  readdirSync(markersDir)
  markerStatus.exists = true
} catch {
  markerStatus.exists = false
}

const deleted = []
const archived = []
if (apply) {
  for (const item of candidates) {
    try {
      if (mode === 'archive') {
        const monthBucket = item.mtime.slice(0, 7) // YYYY-MM
        const targetDir = item.marker
          ? join(archiveRootDir, 'markers', monthBucket)
          : join(archiveRootDir, monthBucket)
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
          2
        )
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
      retentionDays,
      scannedDir: closureDir,
      candidateCount: candidates.length,
      deletedCount: deleted.length,
      archivedCount: archived.length,
      candidates: candidates.map((c) => ({ path: c.path, mtime: c.mtime })),
      archived,
      markerStatus,
      nextSteps: apply
        ? [
            mode === 'archive'
              ? 'Archive applied. Re-run dry-run to confirm zero candidates.'
              : 'Cleanup applied. Re-run dry-run to confirm zero candidates.',
          ]
        : [
            'Dry run only. To apply cleanup:',
            '$env:MARKETING_RELEASE_CLEANUP_APPLY="1"',
            '$env:MARKETING_RELEASE_CLEANUP_MODE="archive"  # or "delete"',
            '$env:MARKETING_RELEASE_CLEANUP_INCLUDE_MARKERS="1"  # optional',
            '$env:MARKETING_RELEASE_CLEANUP_ALLOW_MARKER_MUTATION="1"  # required before marker changes',
            'npm run markers:allow-mutation',
            'npm run cleanup:marketing-release-artifacts',
          ],
    },
    null,
    2
  )
)

