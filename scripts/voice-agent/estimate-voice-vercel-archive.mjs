#!/usr/bin/env node
/**
 * Estimate byte size of files Vercel would upload from the repo root after `.vercelignore`.
 * Uses `git ls-files` (tracked) + `git ls-files --others --exclude-standard` (untracked not gitignored).
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ignore = require('ignore')

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

let ig = null
try {
  const raw = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8')
  ig = ignore().add(raw)
} catch {
  ig = null
}

const HEAVY_SEGMENTS = new Set(['node_modules', '.git', '.next', '.vercel', '__pycache__', '.turbo'])

function segmentSkip(relPosix) {
  return relPosix.split('/').some((seg) => HEAVY_SEGMENTS.has(seg))
}

function shouldIgnore(relPosix) {
  const norm = relPosix.split(path.sep).join('/')
  if (segmentSkip(norm)) return true
  if (ig) return ig.ignores(norm)
  return false
}

function gitLsFilesTracked() {
  const r = spawnSync('git', ['ls-files', '-z'], { cwd: root, maxBuffer: 256 * 1024 * 1024 })
  if (r.status !== 0 || !r.stdout?.length) return []
  return r.stdout.toString('utf8').split('\0').filter(Boolean)
}

function gitUntrackedFiles() {
  const r = spawnSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    maxBuffer: 256 * 1024 * 1024,
  })
  if (r.status !== 0 || !r.stdout?.length) return []
  return r.stdout.toString('utf8').split('\0').filter(Boolean)
}

const trackedFiles = gitLsFilesTracked()
const includeUntracked = process.argv.includes('--include-untracked')
const untrackedFiles = includeUntracked ? gitUntrackedFiles() : []

const allRel = [...new Set([...trackedFiles, ...untrackedFiles])]

let files = 0
let bytes = 0
const largest = []

for (const rel of allRel) {
  const norm = rel.split(path.sep).join('/')
  if (shouldIgnore(norm)) continue
  const abs = path.join(root, rel)
  let st
  try {
    st = fs.statSync(abs)
  } catch {
    continue
  }
  if (!st.isFile()) continue
  files += 1
  bytes += st.size
  if (st.size >= 512 * 1024) largest.push({ rel: norm, size: st.size })
}

largest.sort((a, b) => b.size - a.size)
const largestMb = largest.slice(0, 20).map((x) => ({
  rel: x.rel,
  mb: Math.round((x.size / 1024 / 1024) * 10) / 10,
}))

console.log(
  JSON.stringify(
    {
      root,
      trackedFileCount: trackedFiles.length,
      untrackedConsidered: untrackedFiles.length,
      remainingFiles: files,
      bytes,
      mb: Math.round((bytes / 1024 / 1024) * 10) / 10,
      gb: Math.round((bytes / 1024 / 1024 / 1024) * 100) / 100,
      largestFilesMb: largestMb.slice(0, 20),
      usedIgnorePackage: Boolean(ig),
      note: 'Tracked files (+ optional untracked if run with --include-untracked). Matches typical CI deploy; local `vercel deploy` may still pack extra untracked files.',
    },
    null,
    2,
  ),
)
