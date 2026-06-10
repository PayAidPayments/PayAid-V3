#!/usr/bin/env node
/**
 * Fail fast before a long `vercel deploy` when the token cannot access the voice team/project.
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveVercelToken } from './read-vercel-cli-token.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })
dotenv.config({ path: path.join(root, '.env'), quiet: true })

const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId = process.env.VERCEL_VOICE_PROJECT_ID || 'prj_vlDdR0KxmtdWXHGmjN1gI0EN952D'
const token = resolveVercelToken()

if (!token) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'No Vercel token',
        fix: [
          'Set VERCEL_TOKEN in .env.local (team token from vercel.com/account/tokens), or',
          'Run: npx vercel login',
        ],
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const headers = { Authorization: `Bearer ${token}` }

async function whoami() {
  const res = await fetch('https://api.vercel.com/v2/user', { headers })
  const body = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, user: body?.user || body }
}

async function projectById() {
  const url = new URL(`https://api.vercel.com/v9/projects/${projectId}`)
  url.searchParams.set('teamId', teamId)
  const res = await fetch(url, { headers })
  const body = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, body }
}

const [user, project] = await Promise.all([whoami(), projectById()])

if (!user.ok) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        step: 'whoami',
        httpStatus: user.status,
        error: 'Vercel token rejected',
        fix: [
          'Refresh CLI: npx vercel login',
          'Or add VERCEL_TOKEN=<team token> to .env.local (not VERCEL_OIDC_TOKEN — that is project-scoped)',
        ],
        hint: 'VERCEL_OIDC_TOKEN in .env.local cannot deploy the voice project',
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

if (!project.ok) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        step: 'voice-project',
        httpStatus: project.status,
        teamId,
        projectId,
        error: project.body?.error?.message || 'Cannot read voice project',
        fix: ['Ensure token has access to team payaid-projects-a67c6b27', 'npx vercel login'],
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      user: user.user?.username || user.user?.email || user.user?.id,
      project: project.body?.name || 'voice',
      projectId: project.body?.id || projectId,
      teamId,
    },
    null,
    2,
  ),
)
