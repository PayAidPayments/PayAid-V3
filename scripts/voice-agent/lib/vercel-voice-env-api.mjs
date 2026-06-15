import { readVercelCliToken, sanitizeVercelToken } from '../read-vercel-cli-token.mjs'

export function resolveVercelVoiceContext() {
  const token = sanitizeVercelToken(process.env.VERCEL_TOKEN || readVercelCliToken())
  const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
  const projectId = process.env.VERCEL_VOICE_PROJECT_ID || 'prj_vlDdR0KxmtdWXHGmjN1gI0EN952D'
  return { token, teamId, projectId }
}

export async function listProjectEnvs({ token, teamId, projectId }) {
  const url = `https://api.vercel.com/v9/projects/${projectId}/env?teamId=${teamId}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`list env failed: ${res.status} ${JSON.stringify(body).slice(0, 400)}`)
  }
  return body.envs || []
}

function targetsProduction(entry) {
  const t = entry?.target
  if (!t || (Array.isArray(t) && t.length === 0)) return true
  return Array.isArray(t) && t.includes('production')
}

export function envPresenceReport(envs, specs) {
  return specs.map((spec) => {
    const rows = envs.filter((e) => e.key === spec.key)
    const prod = rows.find(targetsProduction) || rows[0]
    return {
      key: spec.key,
      present: rows.length > 0,
      production: Boolean(prod),
      count: rows.length,
      type: prod?.type || null,
    }
  })
}

export async function upsertPlainEnv({ token, teamId, projectId, key, value, dryRun }) {
  const existing = (await listProjectEnvs({ token, teamId, projectId })).filter((e) => e.key === key)
  if (dryRun) {
    return { key, ok: true, action: existing.length ? 'would-replace' : 'would-create', dryRun: true }
  }
  for (const row of existing) {
    const delUrl = `https://api.vercel.com/v9/projects/${projectId}/env/${row.id}?teamId=${teamId}`
    const del = await fetch(delUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (!del.ok) {
      return { key, ok: false, action: 'delete', status: del.status }
    }
  }
  const url = `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key,
      value,
      type: 'plain',
      target: ['production', 'preview', 'development'],
    }),
  })
  const body = await res.json().catch(() => ({}))
  return {
    key,
    ok: res.ok,
    action: existing.length ? 'replace' : 'create',
    status: res.status,
    id: body.created?.id || body.id || null,
  }
}

export async function upsertEncryptedEnv({ token, teamId, projectId, key, value, dryRun }) {
  const existing = (await listProjectEnvs({ token, teamId, projectId })).filter((e) => e.key === key)
  if (dryRun) {
    return { key, ok: true, action: existing.length ? 'would-replace' : 'would-create', dryRun: true }
  }
  for (const row of existing) {
    const delUrl = `https://api.vercel.com/v9/projects/${projectId}/env/${row.id}?teamId=${teamId}`
    const del = await fetch(delUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (!del.ok) {
      return { key, ok: false, action: 'delete', status: del.status }
    }
  }
  const url = `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key,
      value,
      type: 'encrypted',
      target: ['production', 'preview', 'development'],
    }),
  })
  const body = await res.json().catch(() => ({}))
  return {
    key,
    ok: res.ok,
    action: existing.length ? 'replace' : 'create',
    status: res.status,
    id: body.created?.id || body.id || null,
  }
}
