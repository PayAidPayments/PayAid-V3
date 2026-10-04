/**
 * Ephemeral per-session memory with pluggable store (D2: shared Redis pool + lifecycle).
 *
 * Backend:
 * - default / AI_SESSION_MEMORY_BACKEND=memory → in-process Map (sync + async)
 * - AI_SESSION_MEMORY_BACKEND=redis → shared ioredis pool via getRedisClient()
 *
 * Keys: ai:mem:{tenantId}:{sessionId}
 */

import { scanForPromptInjection } from '@/lib/security/ai-policy/prompt-injection-scanner'
import {
  getSessionMemoryMetrics,
  recordSessionMemoryBlockedWrite,
  recordSessionMemoryDelete,
  recordSessionMemoryError,
  recordSessionMemoryExport,
  recordSessionMemoryHit,
  recordSessionMemoryMiss,
  recordSessionMemoryWrite,
  resetSessionMemoryMetricsForTests,
} from './session-memory-metrics'

export interface SessionMemoryEntry {
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  validated: boolean
}

export interface SessionMemoryStore {
  get(tenantId: string, sessionId: string): Promise<SessionMemoryEntry[]>
  append(
    tenantId: string,
    sessionId: string,
    entry: Omit<SessionMemoryEntry, 'createdAt' | 'validated'>
  ): Promise<SessionMemoryEntry[]>
  clear(tenantId: string, sessionId: string): Promise<void>
  listSessionIds(tenantId: string): Promise<string[]>
  exportTenant(tenantId: string): Promise<Record<string, SessionMemoryEntry[]>>
  deleteTenant(tenantId: string): Promise<number>
}

export const MAX_ENTRIES = 20
export const MAX_ENTRY_CHARS = 4_000
export const SESSION_MEMORY_KEY_PREFIX = 'ai:mem:'

const DEFAULT_TTL_SECONDS = Number(process.env.AI_SESSION_MEMORY_TTL_SECONDS || 86_400)

export function memoryKey(tenantId: string, sessionId: string): string {
  if (!tenantId?.trim()) throw new Error('Session memory requires tenantId')
  if (!sessionId?.trim()) throw new Error('Session memory requires sessionId')
  // Reject path separators / wildcards that could broaden SCAN scope
  if (/[*?\n\r:]/.test(tenantId) || /[*?\n\r:]/.test(sessionId)) {
    throw new Error('Session memory tenantId/sessionId contain illegal characters')
  }
  return `${SESSION_MEMORY_KEY_PREFIX}${tenantId}:${sessionId}`
}

export function tenantKeyPrefix(tenantId: string): string {
  if (!tenantId?.trim()) throw new Error('Session memory requires tenantId')
  if (/[*?\n\r:]/.test(tenantId)) {
    throw new Error('Session memory tenantId contains illegal characters')
  }
  return `${SESSION_MEMORY_KEY_PREFIX}${tenantId}:`
}

export function parseSessionIdFromKey(tenantId: string, key: string): string | null {
  const prefix = tenantKeyPrefix(tenantId)
  if (!key.startsWith(prefix)) return null
  return key.slice(prefix.length) || null
}

function sanitizeEntry(
  entry: Omit<SessionMemoryEntry, 'createdAt' | 'validated'>
): SessionMemoryEntry | null {
  const scan = scanForPromptInjection(entry.content)
  if (scan.blocked) {
    recordSessionMemoryBlockedWrite()
    return null
  }
  return {
    ...entry,
    content: scan.sanitizedText.slice(0, MAX_ENTRY_CHARS),
    createdAt: new Date().toISOString(),
    validated: true,
  }
}

function ttlSeconds(): number {
  const n = Number(process.env.AI_SESSION_MEMORY_TTL_SECONDS || DEFAULT_TTL_SECONDS)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 86_400
}

/** In-process store — default for single-instance / local. */
export class InMemorySessionMemoryStore implements SessionMemoryStore {
  private readonly map = new Map<string, SessionMemoryEntry[]>()

  getSync(tenantId: string, sessionId: string): SessionMemoryEntry[] {
    const entries = this.map.get(memoryKey(tenantId, sessionId)) || []
    if (entries.length) recordSessionMemoryHit()
    else recordSessionMemoryMiss()
    return entries
  }

  appendSync(
    tenantId: string,
    sessionId: string,
    entry: Omit<SessionMemoryEntry, 'createdAt' | 'validated'>
  ): SessionMemoryEntry[] {
    const safe = sanitizeEntry(entry)
    if (!safe) return this.getSync(tenantId, sessionId)
    const key = memoryKey(tenantId, sessionId)
    const next = [...(this.map.get(key) || []), safe].slice(-MAX_ENTRIES)
    this.map.set(key, next)
    recordSessionMemoryWrite()
    return next
  }

  clearSync(tenantId: string, sessionId: string): void {
    this.map.delete(memoryKey(tenantId, sessionId))
    recordSessionMemoryDelete(1)
  }

  async get(tenantId: string, sessionId: string): Promise<SessionMemoryEntry[]> {
    return this.getSync(tenantId, sessionId)
  }

  async append(
    tenantId: string,
    sessionId: string,
    entry: Omit<SessionMemoryEntry, 'createdAt' | 'validated'>
  ): Promise<SessionMemoryEntry[]> {
    return this.appendSync(tenantId, sessionId, entry)
  }

  async clear(tenantId: string, sessionId: string): Promise<void> {
    this.clearSync(tenantId, sessionId)
  }

  async listSessionIds(tenantId: string): Promise<string[]> {
    const prefix = tenantKeyPrefix(tenantId)
    const ids: string[] = []
    for (const key of this.map.keys()) {
      if (key.startsWith(prefix)) {
        const id = parseSessionIdFromKey(tenantId, key)
        if (id) ids.push(id)
      }
    }
    return ids
  }

  async exportTenant(tenantId: string): Promise<Record<string, SessionMemoryEntry[]>> {
    const out: Record<string, SessionMemoryEntry[]> = {}
    for (const sessionId of await this.listSessionIds(tenantId)) {
      out[sessionId] = await this.get(tenantId, sessionId)
    }
    recordSessionMemoryExport()
    return out
  }

  async deleteTenant(tenantId: string): Promise<number> {
    const ids = await this.listSessionIds(tenantId)
    for (const sessionId of ids) {
      this.map.delete(memoryKey(tenantId, sessionId))
    }
    recordSessionMemoryDelete(ids.length)
    return ids.length
  }
}

type RedisLike = {
  get: (k: string) => Promise<string | null>
  setex: (k: string, ttl: number, v: string) => Promise<unknown>
  del: (...keys: string[]) => Promise<unknown>
  keys?: (pattern: string) => Promise<string[]>
  scan?: (
    cursor: string | number,
    ...args: Array<string | number>
  ) => Promise<[string, string[]]>
}

/**
 * Redis-backed store using shared ioredis pool (`getRedisClient`).
 * Fail-open to empty session on Redis errors (never cross-tenant).
 */
export class RedisSessionMemoryStore implements SessionMemoryStore {
  private warned = false
  private client: RedisLike | null = null

  private async redis(): Promise<RedisLike> {
    if (this.client) return this.client
    // Prefer shared Bull/ioredis pool. Dedicated URL only when explicitly different.
    const dedicated = process.env.AI_SESSION_REDIS_URL?.trim()
    const shared = process.env.REDIS_URL?.trim()
    if (dedicated && dedicated !== shared) {
      const Redis = (await import('ioredis')).default
      const instance = new Redis(dedicated, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        lazyConnect: true,
      })
      if (typeof instance.connect === 'function') {
        await instance.connect()
      }
      this.client = instance as unknown as RedisLike
      return this.client
    }
    const { getRedisClient } = await import('@/lib/redis/client')
    this.client = getRedisClient() as unknown as RedisLike
    return this.client
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const r = await this.redis()
    if (typeof r.scan === 'function') {
      const keys: string[] = []
      let cursor = '0'
      do {
        const [next, batch] = await r.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
        cursor = String(next)
        keys.push(...(batch || []))
      } while (cursor !== '0')
      return keys
    }
    if (typeof r.keys === 'function') {
      return r.keys(pattern)
    }
    return []
  }

  async get(tenantId: string, sessionId: string): Promise<SessionMemoryEntry[]> {
    try {
      const r = await this.redis()
      const raw = await r.get(memoryKey(tenantId, sessionId))
      if (!raw) {
        recordSessionMemoryMiss()
        return []
      }
      const parsed = JSON.parse(raw) as SessionMemoryEntry[]
      const entries = Array.isArray(parsed) ? parsed.slice(-MAX_ENTRIES) : []
      if (entries.length) recordSessionMemoryHit()
      else recordSessionMemoryMiss()
      return entries
    } catch (err) {
      recordSessionMemoryError('get', err)
      this.warnOnce(err, 'get')
      return []
    }
  }

  async append(
    tenantId: string,
    sessionId: string,
    entry: Omit<SessionMemoryEntry, 'createdAt' | 'validated'>
  ): Promise<SessionMemoryEntry[]> {
    const safe = sanitizeEntry(entry)
    if (!safe) {
      try {
        const r = await this.redis()
        const raw = await r.get(memoryKey(tenantId, sessionId))
        if (!raw) return []
        const parsed = JSON.parse(raw) as SessionMemoryEntry[]
        return Array.isArray(parsed) ? parsed.slice(-MAX_ENTRIES) : []
      } catch {
        return []
      }
    }
    try {
      const r = await this.redis()
      const key = memoryKey(tenantId, sessionId)
      const raw = await r.get(key)
      let current: SessionMemoryEntry[] = []
      if (raw) {
        const parsed = JSON.parse(raw) as SessionMemoryEntry[]
        current = Array.isArray(parsed) ? parsed : []
      }
      const next = [...current, safe].slice(-MAX_ENTRIES)
      await r.setex(key, ttlSeconds(), JSON.stringify(next))
      recordSessionMemoryWrite()
      return next
    } catch (err) {
      recordSessionMemoryError('append', err)
      this.warnOnce(err, 'append')
      return []
    }
  }

  async clear(tenantId: string, sessionId: string): Promise<void> {
    try {
      const r = await this.redis()
      await r.del(memoryKey(tenantId, sessionId))
      recordSessionMemoryDelete(1)
    } catch (err) {
      recordSessionMemoryError('clear', err)
      this.warnOnce(err, 'clear')
    }
  }

  async listSessionIds(tenantId: string): Promise<string[]> {
    try {
      const keys = await this.scanKeys(`${tenantKeyPrefix(tenantId)}*`)
      return keys
        .map((k) => parseSessionIdFromKey(tenantId, k))
        .filter((id): id is string => Boolean(id))
    } catch (err) {
      recordSessionMemoryError('list', err)
      this.warnOnce(err, 'list')
      return []
    }
  }

  async exportTenant(tenantId: string): Promise<Record<string, SessionMemoryEntry[]>> {
    const out: Record<string, SessionMemoryEntry[]> = {}
    try {
      for (const sessionId of await this.listSessionIds(tenantId)) {
        out[sessionId] = await this.get(tenantId, sessionId)
      }
      recordSessionMemoryExport()
      return out
    } catch (err) {
      recordSessionMemoryError('export', err)
      this.warnOnce(err, 'export')
      return out
    }
  }

  async deleteTenant(tenantId: string): Promise<number> {
    try {
      const r = await this.redis()
      const keys = await this.scanKeys(`${tenantKeyPrefix(tenantId)}*`)
      // Defense-in-depth: only delete keys that still match this tenant prefix
      const prefix = tenantKeyPrefix(tenantId)
      const safeKeys = keys.filter((k) => k.startsWith(prefix))
      if (safeKeys.length) {
        await r.del(...safeKeys)
      }
      recordSessionMemoryDelete(safeKeys.length)
      return safeKeys.length
    } catch (err) {
      recordSessionMemoryError('deleteTenant', err)
      this.warnOnce(err, 'deleteTenant')
      return 0
    }
  }

  private warnOnce(err: unknown, op: string) {
    if (this.warned) return
    this.warned = true
    console.warn(`[session-memory] Redis ${op} failed; fail-open empty session`, err)
  }
}

let activeStore: SessionMemoryStore | null = null

export function getSessionMemoryBackend(): 'memory' | 'redis' {
  const raw = (process.env.AI_SESSION_MEMORY_BACKEND || 'memory').toLowerCase().trim()
  return raw === 'redis' ? 'redis' : 'memory'
}

export function getSessionMemoryStore(): SessionMemoryStore {
  if (!activeStore) {
    activeStore =
      getSessionMemoryBackend() === 'redis'
        ? new RedisSessionMemoryStore()
        : new InMemorySessionMemoryStore()
  }
  return activeStore
}

export function resetSessionMemoryStoreForTests(): void {
  activeStore = null
  resetSessionMemoryMetricsForTests()
}

/**
 * Sync helpers for existing callers (in-memory backend only).
 * Prefer *Async APIs with explicit tenantId for multi-instance Redis.
 */
export function getSessionMemory(sessionId: string, tenantId = 'legacy'): SessionMemoryEntry[] {
  const store = getSessionMemoryStore()
  if (store instanceof InMemorySessionMemoryStore) {
    return store.getSync(tenantId, sessionId)
  }
  return []
}

export function appendSessionMemory(
  sessionId: string,
  entry: Omit<SessionMemoryEntry, 'createdAt' | 'validated'>,
  tenantId = 'legacy'
): SessionMemoryEntry[] {
  const store = getSessionMemoryStore()
  if (store instanceof InMemorySessionMemoryStore) {
    return store.appendSync(tenantId, sessionId, entry)
  }
  void store.append(tenantId, sessionId, entry)
  return []
}

export function clearSessionMemory(sessionId: string, tenantId = 'legacy'): void {
  const store = getSessionMemoryStore()
  if (store instanceof InMemorySessionMemoryStore) {
    store.clearSync(tenantId, sessionId)
    return
  }
  void store.clear(tenantId, sessionId)
}

export async function getSessionMemoryAsync(
  tenantId: string,
  sessionId: string
): Promise<SessionMemoryEntry[]> {
  return getSessionMemoryStore().get(tenantId, sessionId)
}

export async function appendSessionMemoryAsync(
  tenantId: string,
  sessionId: string,
  entry: Omit<SessionMemoryEntry, 'createdAt' | 'validated'>
): Promise<SessionMemoryEntry[]> {
  return getSessionMemoryStore().append(tenantId, sessionId, entry)
}

export async function clearSessionMemoryAsync(
  tenantId: string,
  sessionId: string
): Promise<void> {
  return getSessionMemoryStore().clear(tenantId, sessionId)
}

export async function exportTenantSessionMemory(
  tenantId: string
): Promise<Record<string, SessionMemoryEntry[]>> {
  return getSessionMemoryStore().exportTenant(tenantId)
}

export async function deleteTenantSessionMemory(tenantId: string): Promise<number> {
  return getSessionMemoryStore().deleteTenant(tenantId)
}

export async function listTenantSessionMemoryIds(tenantId: string): Promise<string[]> {
  return getSessionMemoryStore().listSessionIds(tenantId)
}

export { getSessionMemoryMetrics }

/** Format prior turns for model history (excludes system; truncates). */
export function sessionMemoryToChatMessages(
  entries: SessionMemoryEntry[],
  maxTurns = 8
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return entries
    .filter((e) => e.role === 'user' || e.role === 'assistant')
    .slice(-maxTurns)
    .map((e) => ({
      role: e.role as 'user' | 'assistant',
      content: e.content.slice(0, MAX_ENTRY_CHARS),
    }))
}
