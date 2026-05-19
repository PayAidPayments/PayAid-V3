/**
 * Promote a READY deployment to Production (updates project production pointer).
 *
 * Usage:
 *   VERCEL_TOKEN=... VERCEL_COMMIT_SHA=34c880e9 node scripts/vercel-promote-production-deployment.mjs
 *   VERCEL_TOKEN=... VERCEL_DEPLOYMENT_ID=dpl_xxx node scripts/vercel-promote-production-deployment.mjs
 */
const token = process.env.VERCEL_TOKEN || ''
const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const projectId = process.env.VERCEL_PROJECT_ID || 'prj_b0mffvUPCoPODjLDiqCdcJEME7D6'
const deploymentId = (process.env.VERCEL_DEPLOYMENT_ID || '').trim()
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

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(JSON.stringify({ ok: false, status: res.status, body }, null, 2))
    process.exit(1)
  }
  return body.deployments || []
}

async function resolveDeploymentUid() {
  if (deploymentId) {
    return deploymentId.startsWith('dpl_') ? deploymentId : `dpl_${deploymentId}`
  }
  const deployments = (await listDeployments()).filter((d) => d.readyState === 'READY')
  let match = null
  if (commitSha) {
    match = deployments.find((d) => {
      const sha = String(d.meta?.githubCommitSha || '').toLowerCase()
      return sha === commitSha || sha.startsWith(commitSha) || commitSha.startsWith(sha)
    })
  }
  if (!match) match = deployments[0]
  if (!match?.uid) {
    console.error(JSON.stringify({ ok: false, error: 'No READY production deployment found' }, null, 2))
    process.exit(1)
  }
  return match.uid
}

async function promote(uid) {
  const url = new URL(`https://api.vercel.com/v1/deployments/${encodeURIComponent(uid)}/promote`)
  url.searchParams.set('teamId', teamId)
  url.searchParams.set('projectId', projectId)

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(JSON.stringify({ ok: false, status: res.status, uid, body }, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, uid, body }, null, 2))
}

const uid = await resolveDeploymentUid()
await promote(uid)
