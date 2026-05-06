'use strict'

const fs = require('node:fs')
const path = require('node:path')

/**
 * Preferred Node executable for spawned builds / tsc under PayAid tooling.
 *
 * Resolution order:
 * 1. PAYAID_NODE_EXECUTABLE (explicit path; must exist)
 * 2. PAYAID_PROFILE_NODE_EXE (backward compat with profile-next-webpack-build.mjs)
 * 3. On win32 only: `%ProgramFiles%\nodejs\node.exe` then `(x86)` variant when present
 * 4. process.execPath (may be Cursor/IDE bundled Node — fine when no standalone install exists)
 *
 * @param {string} [contextLabel='payaid']
 * @returns {string}
 */
function resolvePayaidNodeExecutable(contextLabel = 'payaid') {
  const envCandidates = []
  const a = process.env.PAYAID_NODE_EXECUTABLE
  const b = process.env.PAYAID_PROFILE_NODE_EXE
  if (a && String(a).trim()) envCandidates.push(['PAYAID_NODE_EXECUTABLE', String(a).trim()])
  if (b && String(b).trim()) envCandidates.push(['PAYAID_PROFILE_NODE_EXE', String(b).trim()])

  for (const [key, raw] of envCandidates) {
    const p = path.normalize(raw)
    if (fs.existsSync(p)) return p
    console.warn(`[${contextLabel}] ${key} points to missing file (${p}); continuing`)
  }

  if (process.platform === 'win32') {
    const candidates = [
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'node.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'nodejs', 'node.exe'),
    ]
    for (const c of candidates) {
      if (fs.existsSync(c)) return c
    }
  }

  return process.execPath
}

module.exports = { resolvePayaidNodeExecutable }
