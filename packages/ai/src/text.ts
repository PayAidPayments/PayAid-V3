/**
 * Text generation: Ollama first (self-hosted), optional Groq cloud fallback.
 */

import { getOllamaBaseUrl, getOllamaModel } from './config'

export interface GenerateTextInput {
  prompt: string
  system?: string
  maxTokens?: number
  /** Ollama / Groq sampling temperature (omit for provider default). */
  temperature?: number
  /** Optional abort signal (for route-level timeouts). */
  signal?: AbortSignal
}

function parseBooleanEnv(v: string | undefined | null): boolean | null {
  if (v == null) return null
  const s = v.trim().toLowerCase()
  if (!s) return null
  if (s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'on') return true
  if (s === 'false' || s === '0' || s === 'no' || s === 'n' || s === 'off') return false
  return null
}

function groqEnabled(): boolean {
  const key = process.env.GROQ_API_KEY?.trim()
  if (!key) return false
  // Default ON when GROQ_API_KEY is present; allow explicit opt-out.
  const flag = parseBooleanEnv(process.env.AI_TEXT_USE_GROQ_FALLBACK)
  return flag !== false
}

function withProviderTimeout(
  upstreamSignal: AbortSignal | undefined,
  timeoutMs: number
): { signal: AbortSignal; cleanup: () => void } {
  const ac = new AbortController()

  const t = setTimeout(() => {
    try {
      ac.abort(new Error('Provider timeout'))
    } catch {
      ac.abort()
    }
  }, Math.max(0, timeoutMs))

  const onAbort = () => {
    try {
      // Propagate the upstream reason when available (Node 18+).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ac.abort((upstreamSignal as any)?.reason)
    } catch {
      ac.abort()
    }
  }

  if (upstreamSignal) {
    if (upstreamSignal.aborted) onAbort()
    else upstreamSignal.addEventListener('abort', onAbort, { once: true })
  }

  return {
    signal: ac.signal,
    cleanup: () => {
      clearTimeout(t)
      if (upstreamSignal) upstreamSignal.removeEventListener('abort', onAbort)
    },
  }
}

async function generateWithOllama(input: GenerateTextInput): Promise<string> {
  const base = getOllamaBaseUrl()
  const model = getOllamaModel()
  const messages: { role: string; content: string }[] = []
  if (input.system) messages.push({ role: 'system', content: input.system })
  messages.push({ role: 'user', content: input.prompt })

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const apiKey = process.env.OLLAMA_API_KEY?.trim()
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const options: Record<string, number> = {}
  if (input.maxTokens != null) options.num_predict = input.maxTokens
  if (input.temperature != null) options.temperature = input.temperature

  const ollamaTimeoutMs = Number(process.env.AI_OLLAMA_TIMEOUT_MS ?? 8_000)
  const { signal, cleanup } = withProviderTimeout(input.signal, ollamaTimeoutMs)
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: Object.keys(options).length ? options : undefined,
      }),
    })

    if (!res.ok) {
      const t = await res.text().catch(() => res.statusText)
      throw new Error(`Ollama chat failed: ${res.status} ${t.slice(0, 200)}`)
    }

    const data = (await res.json()) as { message?: { content?: string }; response?: string }
    const text = data.message?.content ?? data.response ?? ''
    const out = typeof text === 'string' ? text.trim() : ''
    if (!out) throw new Error('Ollama returned empty text')
    return out
  } finally {
    cleanup()
  }
}

async function generateWithGroq(input: GenerateTextInput): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) throw new Error('GROQ_API_KEY not set')
  const model = process.env.GROQ_MODEL?.trim() || 'llama-3.1-8b-instant'
  const messages: { role: string; content: string }[] = []
  if (input.system) messages.push({ role: 'system', content: input.system })
  messages.push({ role: 'user', content: input.prompt })

  const groqTimeoutMs = Number(process.env.AI_GROQ_TIMEOUT_MS ?? 20_000)
  const { signal, cleanup } = withProviderTimeout(input.signal, groqTimeoutMs)
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      body: JSON.stringify({
        model,
        messages,
        temperature: input.temperature ?? 0.4,
        max_tokens: input.maxTokens ?? 2048,
      }),
    })

    if (!res.ok) {
      const t = await res.text().catch(() => res.statusText)
      throw new Error(`Groq chat failed: ${res.status} ${t.slice(0, 200)}`)
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const out = data.choices?.[0]?.message?.content?.trim() ?? ''
    if (!out) throw new Error('Groq returned empty text')
    return out
  } finally {
    cleanup()
  }
}

/**
 * 1) Ollama (local / self-hosted)
 * 2) If `AI_TEXT_USE_GROQ_FALLBACK=true` and Ollama fails, Groq
 * 3) If `AI_TEXT_CLOUD_FIRST=true`, try Groq first then Ollama (optional turbo)
 */
export async function generateText(input: GenerateTextInput): Promise<string> {
  const cloudFirstFlag = parseBooleanEnv(process.env.AI_TEXT_CLOUD_FIRST)
  // Sensible default: when Groq is configured and Ollama is local, prefer Groq first to avoid
  // long hangs when Ollama isn't started.
  const base = getOllamaBaseUrl()
  const inferredCloudFirst =
    !!process.env.GROQ_API_KEY?.trim() && (base.includes('localhost') || base.includes('127.0.0.1'))
  const cloudFirst = cloudFirstFlag ?? inferredCloudFirst

  const tryOllama = async () => generateWithOllama(input)
  const tryGroq = async () => generateWithGroq(input)

  if (cloudFirst && process.env.GROQ_API_KEY?.trim()) {
    try {
      return await tryGroq()
    } catch (e) {
      console.warn('[payaid/ai] Groq failed, falling back to Ollama:', e)
    }
    return tryOllama()
  }

  try {
    return await tryOllama()
  } catch (e) {
    if (groqEnabled()) {
      console.warn('[payaid/ai] Ollama failed, falling back to Groq:', e)
      return tryGroq()
    }
    throw e
  }
}
