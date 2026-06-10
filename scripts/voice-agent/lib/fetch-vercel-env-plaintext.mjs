import { listProjectEnvs, resolveVercelVoiceContext } from './vercel-voice-env-api.mjs'

const MAX_PLAINTEXT_LEN = 256

/** Reject Vercel ciphertext blobs mistaken for secrets (encrypted list often returns long base64). */
export function looksLikePlaintextSecret(value) {
  const v = String(value || '').trim()
  return v.length >= 16 && v.length <= MAX_PLAINTEXT_LEN
}

/**
 * Resolve decrypted plaintext for a project env key (production preferred).
 * Uses list ?decrypt=true&source=vercel-cli:pull, then per-env GET fallback.
 */
export async function fetchVercelEnvPlaintext(key) {
  const { token, teamId, projectId } = resolveVercelVoiceContext()
  if (!token) throw new Error('VERCEL_TOKEN required')

  const listUrl = new URL(`https://api.vercel.com/v9/projects/${projectId}/env`)
  listUrl.searchParams.set('teamId', teamId)
  listUrl.searchParams.set('decrypt', 'true')
  listUrl.searchParams.set('source', 'vercel-cli:pull')

  const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } })
  const listBody = await listRes.json().catch(() => ({}))
  if (!listRes.ok) {
    throw new Error(`list env failed: ${listRes.status}`)
  }

  const rows = (listBody.envs || []).filter((e) => e.key === key)
  const prod =
    rows.find((e) => !e.target?.length || (Array.isArray(e.target) && e.target.includes('production'))) ||
    rows[0]
  if (!prod?.id) return ''

  const fromList = prod.value ? String(prod.value).trim() : ''
  if (looksLikePlaintextSecret(fromList)) return fromList

  const getUrl = new URL(`https://api.vercel.com/v1/projects/${projectId}/env/${prod.id}`)
  getUrl.searchParams.set('teamId', teamId)
  getUrl.searchParams.set('decrypt', 'true')
  getUrl.searchParams.set('source', 'vercel-cli:pull')

  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } })
  const getBody = await getRes.json().catch(() => ({}))
  if (!getRes.ok) return ''

  const fromGet = getBody.value ? String(getBody.value).trim() : ''
  return looksLikePlaintextSecret(fromGet) ? fromGet : ''
}
