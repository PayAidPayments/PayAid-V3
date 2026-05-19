/**
 * Assign payaid-v3.vercel.app (or VERCEL_PRODUCTION_ALIAS) to a ready deployment.
 *
 * Usage:
 *   VERCEL_TOKEN=... node scripts/vercel-promote-production-alias.mjs
 *   VERCEL_TOKEN=... VERCEL_DEPLOYMENT_URL=https://payaid-v3-5lw7qy5w7-payaid-projects-a67c6b27.vercel.app node scripts/vercel-promote-production-alias.mjs
 */
const token = process.env.VERCEL_TOKEN || ''
const teamId = process.env.VERCEL_ORG_ID || 'team_HDFXYTmGsacYZEuYsr6sPTpQ'
const deploymentUrl =
  process.env.VERCEL_DEPLOYMENT_URL ||
  'https://payaid-v3-5lw7qy5w7-payaid-projects-a67c6b27.vercel.app'
const alias = process.env.VERCEL_PRODUCTION_ALIAS || 'payaid-v3.vercel.app'

if (!token) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'VERCEL_TOKEN is required',
        hint: 'Create at https://vercel.com/account/tokens then re-run this script or the GitHub workflow.',
      },
      null,
      2
    )
  )
  process.exit(1)
}

const deploymentId = deploymentUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

async function assignAlias() {
  const url = new URL(`https://api.vercel.com/v2/deployments/${encodeURIComponent(deploymentId)}/aliases`)
  url.searchParams.set('teamId', teamId)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ alias }),
  })

  const body = await res.json().catch(() => ({}))
  const notModified =
    res.status === 409 &&
    body?.error?.code === 'not_modified' &&
    body?.error?.alias === alias

  if (!res.ok && !notModified) {
    console.error(JSON.stringify({ ok: false, status: res.status, body }, null, 2))
    process.exit(1)
  }

  console.log(
    JSON.stringify(
      { ok: true, alias, deploymentId, notModified: Boolean(notModified), body },
      null,
      2
    )
  )
}

assignAlias().catch((err) => {
  console.error(err)
  process.exit(1)
})
