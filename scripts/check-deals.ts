/**
 * Verify deal count for the demo tenant (Deals page data).
 * Requires the dev server to be running.
 *
 * Usage: npm run check:deals
 */

const BASE = process.env.SEED_API_BASE_URL || 'http://localhost:3000'
const TENANT_ID = process.env.DEMO_BUSINESS_ID || 'cmjptk2mw0000aocw31u48n64'

async function main() {
  const url = `${BASE}/api/admin/deals-count?tenantId=${TENANT_ID}`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('[check-deals] Error', res.status, data)
      process.exit(1)
    }
    console.log('[check-deals]', data.message ?? data)
    if (!data.visibleOnDealsPage) {
      console.log('[check-deals] Run: npm run seed:via-api')
      process.exit(1)
    }
  } catch (e) {
    console.error('[check-deals] Request failed. Is the dev server running? (npm run dev)', e)
    process.exit(1)
  }
}

main()
