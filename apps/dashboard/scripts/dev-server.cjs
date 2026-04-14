/**
 * Start Next dev after optionally freeing the listen port (Windows-friendly).
 *
 * SKIP_FREE_PORT=1     — do not kill; use PORT only (fail if busy)
 * PORT=3001            — preferred port
 * DEV_PORT_TRY_RANGE=25 — if preferred busy after kill, try PORT..PORT+range-1
 * NEXT_DEV_HOST=0.0.0.0 — listen address (default 0.0.0.0 so localhost + 127.0.0.1 work on Windows)
 * PAYAID_DEV_TURBOPACK=1 — opt in to Turbopack (default is webpack; Turbopack often stalls on huge / on Windows)
 */
const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const dns = require('dns')
const net = require('net')
const { URL } = require('url')
const dotenv = require('dotenv')

const appRoot = path.join(__dirname, '..')
const skipFree = process.env.SKIP_FREE_PORT === '1' || process.env.CI === 'true'
const portRange =
  parseInt(process.env.DEV_PORT_TRY_RANGE || '25', 10) || 25

// Load env here too (before next dev) so we can run external preflight checks.
dotenv.config({ path: path.join(appRoot, '..', '..', '.env') })
dotenv.config({ path: path.join(appRoot, '..', '..', '.env.local'), override: true })
dotenv.config({ path: path.join(appRoot, '..', '..', '.env.development'), override: true })
dotenv.config({ path: path.join(appRoot, '..', '..', '.env.development.local'), override: true })

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

async function checkDns(host) {
  await withTimeout(dns.promises.lookup(host), 2000, `DNS lookup for ${host}`)
}

async function checkTcp(host, port) {
  await withTimeout(
    new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port }, () => {
        socket.end()
        resolve(true)
      })
      socket.setTimeout(2500)
      socket.on('timeout', () => {
        socket.destroy()
        reject(new Error(`TCP timeout ${host}:${port}`))
      })
      socket.on('error', reject)
    }),
    3000,
    `TCP check for ${host}:${port}`
  )
}

function parseHostPort(input, fallbackPort) {
  if (!input) return null
  try {
    const u = new URL(input)
    const host = u.hostname
    const port = u.port ? parseInt(u.port, 10) : fallbackPort
    if (!host || !port) return null
    return { host, port }
  } catch {
    return null
  }
}

async function runExternalPreflight() {
  const checks = []

  const dbConn = parseHostPort(process.env.DATABASE_URL || '', 5432)
  if (dbConn) checks.push({ name: 'Supabase/Postgres', host: dbConn.host, port: dbConn.port })

  const upstashRest = parseHostPort(process.env.UPSTASH_REDIS_REST_URL || '', 443)
  if (upstashRest) checks.push({ name: 'Upstash REST', host: upstashRest.host, port: upstashRest.port })

  const redisTcp = parseHostPort(process.env.REDIS_URL || '', 6379)
  if (redisTcp) checks.push({ name: 'Redis TCP', host: redisTcp.host, port: redisTcp.port })

  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    checks.push({ name: 'Groq API', host: 'api.groq.com', port: 443 })
  }

  if (checks.length === 0) return

  console.log('[dev-server] External preflight (Groq/Upstash/Supabase)')
  const failures = []
  for (const svc of checks) {
    try {
      await checkDns(svc.host)
      await checkTcp(svc.host, svc.port)
      console.log(`  ✓ ${svc.name}: ${svc.host}:${svc.port}`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`  ✗ ${svc.name}: ${svc.host}:${svc.port} — ${msg}`)
      failures.push(`${svc.name} (${svc.host}:${svc.port})`)
    }
  }

  if (failures.length > 0) {
    console.error('')
    console.error(
      `[dev-server] External services not reachable: ${failures.join(', ')}.`
    )
    console.error(
      '[dev-server] Failing fast to prevent long "Starting..." / compile hangs with retry storms.'
    )
    process.exit(1)
  }
}

function sleepMs(ms) {
  try {
    if (process.platform === 'win32') {
      execSync(`cmd /c ping 127.0.0.1 -n ${Math.max(2, Math.ceil(ms / 1000) + 1)} >nul`, {
        stdio: 'ignore',
        windowsHide: true,
      })
    } else {
      execSync(`sleep ${Math.ceil(ms / 1000)}`, { stdio: 'ignore' })
    }
  } catch {
    const end = Date.now() + ms
    while (Date.now() < end) {
      /* sync fallback */
    }
  }
}

function findListeningPids(winPort) {
  if (process.platform !== 'win32') {
    try {
      const out = execSync(`lsof -i :${winPort} -sTCP:LISTEN -t`, {
        encoding: 'utf8',
      }).trim()
      return out ? [...new Set(out.split(/\n/).filter(Boolean))] : []
    } catch {
      return []
    }
  }
  const out = execSync('netstat -ano', { encoding: 'utf8', windowsHide: true })
  const pids = new Set()
  const portSuffix = `:${winPort}`
  for (const line of out.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) continue
    const parts = line.trim().split(/\s+/)
    if (parts.length < 5) continue
    const local = parts[1]
    if (!local || !local.endsWith(portSuffix)) continue
    const pid = parts[parts.length - 1]
    if (/^\d+$/.test(pid)) pids.add(pid)
  }
  return [...pids]
}

function killWindowsPid(pid) {
  const opts = {
    stdio: 'pipe',
    windowsHide: true,
    timeout: 25000,
    encoding: 'utf8',
  }
  try {
    execSync(`taskkill /PID ${pid} /F /T`, opts)
    return true
  } catch {
    try {
      execSync(
        `powershell -NoProfile -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`,
        opts
      )
      return true
    } catch {
      return false
    }
  }
}

function freePortUnix(winPort) {
  try {
    const out = execSync(`lsof -ti :${winPort}`, { encoding: 'utf8' }).trim()
    const pids = out ? out.split(/\n/).filter(Boolean) : []
    for (const pid of pids) {
      console.log(`[dev-server] Freeing port ${winPort}: stopping PID ${pid}`)
      try {
        process.kill(parseInt(pid, 10), 'SIGTERM')
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* nothing listening or lsof missing */
  }
}

function freePortAggressive(winPort) {
  if (process.platform !== 'win32') {
    freePortUnix(winPort)
    return
  }
  const pids = findListeningPids(winPort)
  for (const pid of pids) {
    console.log(`[dev-server] Freeing port ${winPort}: stopping PID ${pid} (taskkill /T + PowerShell fallback)`)
    const ok = killWindowsPid(pid)
    if (!ok) {
      console.warn(`[dev-server] Could not stop PID ${pid} — will try another port if needed`)
    }
  }
}

function resolveNextCli() {
  const candidates = [
    path.join(appRoot, 'node_modules', 'next', 'dist', 'bin', 'next'),
    path.join(appRoot, '..', 'node_modules', 'next', 'dist', 'bin', 'next'),
    path.join(appRoot, '..', '..', 'node_modules', 'next', 'dist', 'bin', 'next'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.realpathSync(p)
  }
  try {
    return require.resolve('next/dist/bin/next', { paths: [appRoot] })
  } catch {
    /* fall through */
  }
  console.error('[dev-server] Next.js CLI not found. Tried:', candidates)
  console.error('[dev-server] Run: npm install (repo root)')
  process.exit(1)
}

function choosePort() {
  const preferred = parseInt(process.env.PORT || '3000', 10) || 3000

  if (skipFree) {
    return String(preferred)
  }

  const preferredStr = String(preferred)
  const hadListeners = findListeningPids(preferredStr).length > 0
  if (process.platform === 'win32') {
    freePortAggressive(preferredStr)
    // OS needs a moment to release the port after taskkill; skip when nothing was bound (saves ~1.2s every start)
    if (hadListeners) sleepMs(1200)
  } else {
    freePortUnix(preferredStr)
    if (hadListeners) sleepMs(800)
  }

  for (let p = preferred; p < preferred + portRange; p++) {
    const ps = String(p)
    if (findListeningPids(ps).length === 0) {
      if (p !== preferred) {
        console.log(
          `[dev-server] Port ${preferred} still in use — starting on http://localhost:${ps}`
        )
      }
      return ps
    }
  }

  console.error(
    `[dev-server] No free port between ${preferred} and ${preferred + portRange - 1}. Close other apps or set PORT=...`
  )
  process.exit(1)
}

async function main() {
  await runExternalPreflight()

  const nextCli = resolveNextCli()
  const port = choosePort()
  const preferred = parseInt(process.env.PORT || '3000', 10) || 3000
  const host = (process.env.NEXT_DEV_HOST || '0.0.0.0').trim() || '0.0.0.0'

  const url = `http://localhost:${port}/`
  console.log('')
  console.log('══════════════════════════════════════════════════════')
  console.log('  PayAid dashboard dev')
  console.log(`  Open in browser:  ${url}`)
  if (String(port) !== String(preferred)) {
    console.log(`  (port ${preferred} was busy — not using http://localhost:${preferred})`)
  }
  console.log(`  Listening on:     ${host}:${port}`)
  const useTurbo =
    process.env.PAYAID_DEV_TURBOPACK === '1' || process.env.NEXT_DEV_TURBOPACK === '1'
  const nextDevArgs = [nextCli, 'dev', '-H', host, '-p', port]
  const bundlerFlag = useTurbo ? '--turbo' : '--webpack'
  nextDevArgs.splice(2, 0, bundlerFlag)
  console.log(
    `  next dev:         ${bundlerFlag} (webpack default; PAYAID_DEV_TURBOPACK=1 for Turbopack)`
  )
  console.log(`  flags:            -H ${host} -p ${port}`)
  console.log('══════════════════════════════════════════════════════')
  console.log('')

  const childEnv = { ...process.env, PORT: port, NEXT_DEV_HOST: host }
  delete childEnv.NEXT_DEV_TURBOPACK
  delete childEnv.PAYAID_DEV_TURBOPACK

  const child = spawn(process.execPath, nextDevArgs, {
    cwd: appRoot,
    stdio: 'inherit',
    env: childEnv,
    windowsHide: true,
  })

  child.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error('')
      console.error(
        `[dev-server] next dev exited with code ${code}${signal ? ` (signal: ${signal})` : ''}.`
      )
      console.error(
        '  If this happened right after saving next.config.*, try running npm run dev again without editing the config until it is stable.'
      )
      console.error(
        '  On Windows, port contention after an internal restart can also cause this — close other Node processes on the same PORT or set PORT=3001.'
      )
      console.error('')
    }
    if (signal) process.kill(process.pid, signal)
    process.exit(code ?? 0)
  })

  child.on('error', (err) => {
    console.error('[dev-server] Failed to spawn next dev:', err)
    process.exit(1)
  })
}

main().catch((err) => {
  console.error('[dev-server] Startup preflight failed:', err)
  process.exit(1)
})
