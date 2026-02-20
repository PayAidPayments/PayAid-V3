/**
 * Seed demo data by calling the app's seed API.
 * Use this when CLI seeds fail (e.g. RLS / pooler). Requires the dev server to be running.
 *
 * Usage:
 *   npm run seed:via-api
 *   DEMO_BUSINESS_ID=xxx npm run seed:via-api
 */

const BASE = process.env.SEED_API_BASE_URL || 'http://localhost:3000'
const TENANT_ID = process.env.DEMO_BUSINESS_ID || 'cmjptk2mw0000aocw31u48n64'

async function main() {
  const url = `${BASE}/api/admin/seed-demo-data?trigger=true&comprehensive=true&tenantId=${TENANT_ID}&background=false`
  console.log('[seed-via-api] Calling', url)
  try {
    const res = await fetch(url, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('[seed-via-api] Error', res.status, data)
      process.exit(1)
    }
    console.log('[seed-via-api] Success:', data.message ?? data)
    if (data.background) {
      console.log('[seed-via-api] Seed running in background. Refresh the app in ~1 minute.')
    }
  } catch (e) {
    console.error('[seed-via-api] Request failed. Is the dev server running? (npm run dev)', e)
    process.exit(1)
  }
}

main()
