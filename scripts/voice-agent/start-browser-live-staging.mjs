#!/usr/bin/env node
/**
 * One-command browser-live staging stack (investor demo bridge).
 * Starts WSS sidecar + Cloudflare quick tunnel; optionally wires Vercel.
 *
 * Usage:
 *   npm run voice-agent:start-browser-live-staging
 *   npm run voice-agent:start-browser-live-staging -- --wire   # push new tunnel URL + redeploy voice
 *   BROWSER_LIVE_STUB=1 npm run voice-agent:start-browser-live-staging
 */
import dotenv from 'dotenv'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(root, '.env.local'), quiet: true })

const wire = process.argv.includes('--wire')
const port = process.env.VOICE_LIVE_WS_PORT || '3002'
const outDir = path.join(root, '.tmp')
const urlFile = path.join(outDir, 'browser-live-tunnel-url.txt')
const cloudflared =
  process.env.CLOUDFLARED_BIN ||
  (process.platform === 'win32'
    ? path.join(os.homedir(), '.cloudflared', 'cloudflared.exe')
    : 'cloudflared')

if (!existsSync(cloudflared) && process.platform === 'win32') {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'cloudflared not found',
        fix: 'Run once: iwr https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -OutFile $env:USERPROFILE\\.cloudflared\\cloudflared.exe',
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })

function upsertEnvLocal(key, value) {
  const envPath = path.join(root, '.env.local')
  if (!existsSync(envPath)) return
  let text = readFileSync(envPath, 'utf8')
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, 'm')
  text = re.test(text) ? text.replace(re, line) : `${text.trimEnd()}\n${line}\n`
  writeFileSync(envPath, text.endsWith('\n') ? text : `${text}\n`)
}

const sidecarEnv = {
  ...process.env,
  PAYAID_CLI_SCRIPT: '1',
}

console.log(JSON.stringify({ step: 'start-sidecar', port, stub: process.env.BROWSER_LIVE_STUB === '1' }, null, 2))

const sidecar = spawn('npm', ['run', 'dev:browser-live-ws'], {
  cwd: root,
  env: sidecarEnv,
  stdio: 'ignore',
  shell: process.platform === 'win32',
  detached: true,
})
sidecar.unref()

await new Promise((r) => setTimeout(r, 8000))

let tunnelHost = ''
const tunnel = spawn(
  cloudflared,
  ['tunnel', '--url', `http://127.0.0.1:${port}`, '--no-autoupdate'],
  { shell: process.platform === 'win32' },
)

tunnel.stderr?.on('data', (chunk) => {
  const text = String(chunk)
  process.stderr.write(text)
  const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i)
  if (m && !tunnelHost) {
    tunnelHost = m[0].replace(/^https:/i, 'wss:')
    writeFileSync(urlFile, `${tunnelHost}\n`, 'utf8')
    upsertEnvLocal('NEXT_PUBLIC_VOICE_LIVE_WS_URL', tunnelHost)
    console.log('\n' + JSON.stringify({ ok: true, tunnelWss: tunnelHost, urlFile }, null, 2) + '\n')
    if (wire) {
      spawnSync('node', ['scripts/voice-agent/wire-browser-live-production.mjs', '--deploy'], {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, NEXT_PUBLIC_VOICE_LIVE_WS_URL: tunnelHost },
        shell: process.platform === 'win32',
      })
    }
  }
})

tunnel.stdout?.on('data', (chunk) => process.stdout.write(chunk))

process.on('SIGINT', () => {
  tunnel.kill()
  process.exit(0)
})

tunnel.on('exit', (code) => process.exit(code ?? 0))
