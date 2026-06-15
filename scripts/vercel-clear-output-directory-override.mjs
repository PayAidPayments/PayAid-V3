/**
 * Clear dashboard Output Directory override so vercel.json is source of truth.
 * Usage: VERCEL_TOKEN=... node scripts/vercel-clear-output-directory-override.mjs
 */
const token = process.env.VERCEL_TOKEN || ''
const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId = process.env.VERCEL_PROJECT_ID || 'prj_b0mffvUPCoPODjLDiqCdcJEME7D6'

if (!token) {
  console.error(JSON.stringify({ ok: false, error: 'VERCEL_TOKEN required' }, null, 2))
  process.exit(1)
}

async function getProject() {
  const url = new URL(`https://api.vercel.com/v9/projects/${projectId}`)
  url.searchParams.set('teamId', teamId)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(JSON.stringify({ ok: false, step: 'get', status: res.status, body }, null, 2))
    process.exit(1)
  }
  return body
}

async function patchProject() {
  const url = new URL(`https://api.vercel.com/v9/projects/${projectId}`)
  url.searchParams.set('teamId', teamId)
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ outputDirectory: null }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(JSON.stringify({ ok: false, step: 'patch', status: res.status, body }, null, 2))
    process.exit(1)
  }
  return body
}

const before = await getProject()
const hadOverride = Boolean(before.outputDirectory)

if (!hadOverride) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        changed: false,
        message: 'outputDirectory already empty; no patch needed',
        framework: before.framework,
        outputDirectory: before.outputDirectory || '',
      },
      null,
      2
    )
  )
  process.exit(0)
}

const after = await patchProject()
console.log(
  JSON.stringify(
    {
      ok: true,
      changed: true,
      before: { framework: before.framework, outputDirectory: before.outputDirectory },
      after: { framework: after.framework, outputDirectory: after.outputDirectory || '' },
    },
    null,
    2
  )
)
