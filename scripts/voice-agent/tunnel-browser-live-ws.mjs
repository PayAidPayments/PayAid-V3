#!/usr/bin/env node
/**
 * Start Cloudflare quick tunnel to local browser-live sidecar (staging bridge).
 * Requires sidecar on port 3002: npm run dev:browser-live-ws
 *
 * Usage: npm run voice-agent:tunnel-browser-live-ws
 * Then set NEXT_PUBLIC_VOICE_LIVE_WS_URL=wss://<host>.trycloudflare.com and wire Vercel.
 */
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

const port = process.env.VOICE_LIVE_WS_PORT || '3002'
const cloudflared =
  process.env.CLOUDFLARED_BIN ||
  (process.platform === 'win32'
    ? path.join(os.homedir(), '.cloudflared', 'cloudflared.exe')
    : 'cloudflared')

console.log(
  JSON.stringify(
    {
      step: 'cloudflare-quick-tunnel',
      port,
      cloudflared,
      hint: 'Copy the https://*.trycloudflare.com URL → wss://… for NEXT_PUBLIC_VOICE_LIVE_WS_URL',
    },
    null,
    2,
  ),
)

const child = spawn(cloudflared, ['tunnel', '--url', `http://127.0.0.1:${port}`, '--no-autoupdate'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('exit', (code) => process.exit(code ?? 0))
