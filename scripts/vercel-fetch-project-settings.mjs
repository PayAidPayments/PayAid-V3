/**
 * Print Vercel project settings (framework + output directory) for drift checks.
 * Usage: VERCEL_TOKEN=... node scripts/vercel-fetch-project-settings.mjs
 */
const token = process.env.VERCEL_TOKEN || ''
const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId = process.env.VERCEL_PROJECT_ID || 'prj_b0mffvUPCoPODjLDiqCdcJEME7D6'

if (!token) {
  console.error(JSON.stringify({ ok: false, error: 'VERCEL_TOKEN required' }, null, 2))
  process.exit(1)
}

const url = new URL(`https://api.vercel.com/v9/projects/${projectId}`)
url.searchParams.set('teamId', teamId)

const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
const body = await res.json().catch(() => ({}))
if (!res.ok) {
  console.error(JSON.stringify({ ok: false, status: res.status, body }, null, 2))
  process.exit(1)
}

const root = body.rootDirectory ?? null
const framework = body.framework ?? null
const outputDirectory = body.outputDirectory ?? null

console.log(
  JSON.stringify(
    {
      ok: true,
      projectId,
      name: body.name,
      rootDirectory: root,
      framework,
      outputDirectory: outputDirectory || '',
      staleOutputOverride: Boolean(outputDirectory),
      frameworkMatchesNextjs: framework === 'nextjs' || framework === null,
    },
    null,
    2
  )
)
