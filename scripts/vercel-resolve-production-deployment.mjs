/**
 * Resolve latest READY production deployment URL for a git commit (or project).
 *
 * Usage:
 *   VERCEL_TOKEN=... VERCEL_COMMIT_SHA=34c880e9 node scripts/vercel-resolve-production-deployment.mjs
 */
const token = process.env.VERCEL_TOKEN || ''
const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId = process.env.VERCEL_PROJECT_ID || 'prj_b0mffvUPCoPODjLDiqCdcJEME7D6'
const commitSha = (process.env.VERCEL_COMMIT_SHA || '').trim().toLowerCase()

if (!token) {
  console.error(JSON.stringify({ ok: false, error: 'VERCEL_TOKEN is required' }, null, 2))
  process.exit(1)
}

async function listDeployments() {
  const url = new URL('https://api.vercel.com/v6/deployments')
  url.searchParams.set('teamId', teamId)
  url.searchParams.set('projectId', projectId)
  url.searchParams.set('limit', '30')
  url.searchParams.set('target', 'production')

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(JSON.stringify({ ok: false, status: res.status, body }, null, 2))
    process.exit(1)
  }
  return body.deployments || []
}

function deploymentUrl(deployment) {
  const host = deployment.url || deployment.alias?.[0]
  if (!host) return null
  return host.startsWith('http') ? host : `https://${host}`
}

async function main() {
  const deployments = await listDeployments()
  const ready = deployments.filter((d) => d.readyState === 'READY')

  let match = null
  if (commitSha) {
    match = ready.find((d) => {
      const sha = String(d.meta?.githubCommitSha || '').toLowerCase()
      return sha === commitSha || sha.startsWith(commitSha) || commitSha.startsWith(sha)
    })
  }
  if (!match) {
    match = ready[0]
  }

  if (!match) {
    console.error(JSON.stringify({ ok: false, error: 'No READY production deployment found' }, null, 2))
    process.exit(1)
  }

  const url = deploymentUrl(match)
  console.log(
    JSON.stringify(
      {
        ok: true,
        deploymentUrl: url,
        uid: match.uid,
        id: match.id,
        name: match.name,
        commitSha: match.meta?.githubCommitSha,
        readyState: match.readyState,
      },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
