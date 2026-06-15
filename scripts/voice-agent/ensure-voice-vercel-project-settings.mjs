#!/usr/bin/env node
/**
 * Ensure voice Vercel project builds from monorepo root (not apps/voice partial upload).
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readVercelCliToken } from './read-vercel-cli-token.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId = process.env.VERCEL_VOICE_PROJECT_ID || 'prj_vlDdR0KxmtdWXHGmjN1gI0EN952D'
const token = process.env.VERCEL_TOKEN?.trim() || readVercelCliToken()
if (!token) {
  console.error(JSON.stringify({ ok: false, error: 'Vercel CLI login required' }, null, 2))
  process.exit(1)
}

const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
const getUrl = new URL(`https://api.vercel.com/v9/projects/${projectId}`)
getUrl.searchParams.set('teamId', teamId)

const beforeRes = await fetch(getUrl, { headers })
const beforeBody = await beforeRes.json().catch(() => ({}))
if (!beforeRes.ok) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'Vercel API rejected request — run `npx vercel login` and retry',
        httpStatus: beforeRes.status,
        detail: beforeBody?.error?.message || beforeBody,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}
const before = beforeBody
const desired = {
  rootDirectory: null,
  framework: 'nextjs',
  outputDirectory: 'apps/voice/.next',
  installCommand: 'npm install --legacy-peer-deps --no-audit --no-fund',
  buildCommand:
    'npx prisma generate --schema=packages/db/prisma/schema.prisma && npm run build -w voice',
}

const needsPatch =
  before.rootDirectory ||
  (before.installCommand || '').includes('cd ../..') ||
  before.outputDirectory !== desired.outputDirectory

let patchOk = true
if (needsPatch) {
  const patchUrl = new URL(`https://api.vercel.com/v9/projects/${projectId}`)
  patchUrl.searchParams.set('teamId', teamId)
  const res = await fetch(patchUrl, { method: 'PATCH', headers, body: JSON.stringify(desired) })
  patchOk = res.ok
}

const afterRes = await fetch(getUrl, { headers })
const after = await afterRes.json().catch(() => ({}))
console.log(
  JSON.stringify(
    {
      ok: patchOk,
      needsPatch,
      before: {
        rootDirectory: before.rootDirectory,
        installCommand: before.installCommand,
        buildCommand: before.buildCommand,
        outputDirectory: before.outputDirectory,
      },
      after: {
        rootDirectory: after.rootDirectory,
        installCommand: after.installCommand,
        buildCommand: after.buildCommand,
        outputDirectory: after.outputDirectory,
      },
    },
    null,
    2,
  ),
)
process.exit(patchOk ? 0 : 1)
