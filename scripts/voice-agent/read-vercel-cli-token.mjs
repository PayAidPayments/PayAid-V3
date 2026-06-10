import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

/** Remove non-ASCII characters from tokens (corrupted .env.local pastes break fetch headers). */
export function sanitizeVercelToken(raw) {
  const t = String(raw || '').trim()
  return t ? t.replace(/[^\x20-\x7E]/g, '') : ''
}

export function resolveVercelToken() {
  const fromEnv = sanitizeVercelToken(process.env.VERCEL_TOKEN)
  if (fromEnv) return fromEnv
  return sanitizeVercelToken(readVercelCliToken())
}

export function readVercelCliToken() {
  const home = process.env.USERPROFILE || process.env.HOME || ''
  const candidates = [
    path.join(home, 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json'),
    path.join(home, '.local', 'share', 'com.vercel.cli', 'auth.json'),
  ]
  for (const p of candidates) {
    if (!existsSync(p)) continue
    try {
      const data = JSON.parse(readFileSync(p, 'utf8'))
      const t = data?.token || data?.tokens?.[0]?.token
      if (t && String(t).trim()) return String(t).trim()
    } catch {
      /* ignore */
    }
  }
  return ''
}
