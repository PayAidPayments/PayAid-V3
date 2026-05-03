/**
 * Cross-platform deployment verification (Node/tsx).
 * Usage: BASE_URL=https://payaid-v3.vercel.app npx tsx scripts/verify-deployment.ts
 * Default BASE_URL: https://payaid-v3.vercel.app
 */

const BASE_URL = (process.env.BASE_URL || 'https://payaid-v3.vercel.app').replace(/\/$/, '')

const results: { name: string; ok: boolean; detail?: string }[] = []

async function main() {
  console.log('\n🔍 PayAid V3 Deployment Verification\n')
  console.log(`Testing: ${BASE_URL}\n`)

  // 1. Health
  try {
    const r = await fetch(`${BASE_URL}/api/health`)
    const data = (await r.json()) as { status?: string; checks?: { database?: { connected?: boolean } } }
    const ok = r.ok && data.status === 'healthy'
    results.push({
      name: 'Health',
      ok,
      detail: ok ? `DB: ${data.checks?.database?.connected ? 'connected' : '?'}` : `${r.status}`,
    })
    console.log(ok ? '   ✅ Health check passed' : `   ❌ Health failed: ${r.status}`)
  } catch (e) {
    results.push({ name: 'Health', ok: false, detail: String(e) })
    console.log('   ❌ Health check failed:', (e as Error).message)
  }

  // 2. Login
  let token: string | null = null
  try {
    const r = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@demo.com', password: 'Test@1234' }),
    })
    const data = (await r.json()) as { token?: string; message?: string }
    token = data.token ?? null
    const ok = !!token
    results.push({ name: 'Login', ok, detail: ok ? 'token received' : data.message || `${r.status}` })
    console.log(ok ? '   ✅ Login successful' : `   ❌ Login failed: ${data.message || r.status}`)
  } catch (e) {
    results.push({ name: 'Login', ok: false, detail: String(e) })
    console.log('   ❌ Login failed:', (e as Error).message)
  }

  // 3. AI Co-Founder (if token)
  if (token) {
    try {
      const r = await fetch(`${BASE_URL}/api/ai/cofounder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello, test' }),
      })
      const data = (await r.json()) as { message?: unknown; agent?: unknown }
      const ok = r.ok && (data.message != null || data.agent != null)
      results.push({ name: 'AI Co-Founder', ok, detail: ok ? 'OK' : `${r.status}` })
      console.log(ok ? '   ✅ AI Co-Founder OK' : `   ❌ AI Co-Founder: ${r.status}`)
    } catch (e) {
      results.push({ name: 'AI Co-Founder', ok: false, detail: String(e) })
      console.log('   ❌ AI Co-Founder failed:', (e as Error).message)
    }
  }

  const passed = results.filter((x) => x.ok).length
  const failed = results.filter((x) => !x.ok).length
  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary: ' + passed + ' passed, ' + failed + ' failed')
  if (failed > 0) console.log('💡 See docs/DEPLOYMENT_VERIFICATION.md and manual steps below.')
  console.log('')
  process.exit(failed > 0 ? 1 : 0)
}

main()
