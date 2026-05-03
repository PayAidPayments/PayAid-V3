'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Inbox, MessageSquare, User, Tag, Send, Loader2, Clock, AlertTriangle } from 'lucide-react'

type ConvRow = {
  id: string
  conversation_id: string
  channel: string
  direction: string
  body_preview: string
  status: string
  owner_user_id: string | null
  occurred_at: string
  tags?: string[]
  sentiment?: string | null
  sla_due_at?: string | null
}

function slaLabel(slaDueAt: string | null | undefined, status: string) {
  if (!slaDueAt || status !== 'open') return null
  const due = new Date(slaDueAt).getTime()
  const now = Date.now()
  const breached = due < now
  const rel = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const sec = Math.round((due - now) / 1000)
  const text =
    Math.abs(sec) < 60
      ? rel.format(Math.round(sec / 60), 'minute')
      : Math.abs(sec) < 3600
        ? rel.format(Math.round(sec / 60), 'minute')
        : rel.format(Math.round(sec / 3600), 'hour')
  return { breached, text, due: new Date(slaDueAt).toLocaleString() }
}

type ThreadMsg = {
  id: string
  direction: string
  body: string
  occurred_at: string
}

type UniboxSettings = {
  first_response_sla_minutes: number
  enforce: boolean
}

export default function SupportUniboxPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [items, setItems] = useState<ConvRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ConvRow | null>(null)
  const [ownerInput, setOwnerInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [mutating, setMutating] = useState<'assign' | 'tag' | 'reply' | null>(null)
  const [threadMessages, setThreadMessages] = useState<ThreadMsg[]>([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [settings, setSettings] = useState<UniboxSettings>({ first_response_sla_minutes: 30, enforce: true })
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  )

  const load = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/v1/conversations?limit=100', { headers: authHeaders })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to load conversations')
      setItems(Array.isArray(data.conversations) ? data.conversations : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [token, authHeaders])

  useEffect(() => {
    load()
  }, [load])

  const loadSettings = useCallback(async () => {
    if (!token) return
    try {
      setLoadingSettings(true)
      const res = await fetch('/api/v1/conversations/settings', { headers: authHeaders })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to load Unibox settings')
      if (data?.settings) setSettings(data.settings)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Unibox settings')
    } finally {
      setLoadingSettings(false)
    }
  }, [token, authHeaders])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const loadThread = useCallback(
    async (conversationRowId: string) => {
      if (!token) return
      try {
        setLoadingThread(true)
        const res = await fetch(`/api/v1/conversations/${conversationRowId}/messages?limit=200`, {
          headers: authHeaders,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Failed to load thread')
        setThreadMessages(Array.isArray(data.messages) ? data.messages : [])
      } catch (e) {
        setThreadMessages([])
        setError(e instanceof Error ? e.message : 'Failed to load thread')
      } finally {
        setLoadingThread(false)
      }
    },
    [token, authHeaders]
  )

  useEffect(() => {
    if (selected?.id) {
      void loadThread(selected.id)
    } else {
      setThreadMessages([])
    }
  }, [selected?.id, loadThread])

  async function assignOwner() {
    if (!selected || !ownerInput.trim()) return
    try {
      setMutating('assign')
      const res = await fetch(`/api/v1/conversations/${selected.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ owner_user_id: ownerInput.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Assign failed')
      setOwnerInput('')
      await load()
      setSelected((s) => (s ? { ...s, owner_user_id: ownerInput.trim() } : null))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assign failed')
    } finally {
      setMutating(null)
    }
  }

  async function saveTags() {
    if (!selected) return
    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    try {
      setMutating('tag')
      const res = await fetch(`/api/v1/conversations/${selected.id}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ tags }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Tag failed')
      setTagInput('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tag failed')
    } finally {
      setMutating(null)
    }
  }

  async function sendReply() {
    if (!selected || !replyBody.trim()) return
    try {
      setMutating('reply')
      const res = await fetch(`/api/v1/conversations/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ body: replyBody.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Reply failed')
      setReplyBody('')
      await load()
      await loadThread(selected.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reply failed')
    } finally {
      setMutating(null)
    }
  }

  async function saveSettings() {
    try {
      setSavingSettings(true)
      const res = await fetch('/api/v1/conversations/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          first_response_sla_minutes: Math.max(1, Math.floor(settings.first_response_sla_minutes || 1)),
          enforce: settings.enforce,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save Unibox settings')
      if (data?.settings) setSettings(data.settings)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save Unibox settings')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Inbox className="h-7 w-7 text-violet-600" />
          Unibox
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Omnichannel queue for tenant <span className="font-mono text-xs">{tenantId}</span>. Ingest via{' '}
          <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">POST /api/v1/conversations/ingest</code>.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-2 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tenant SLA settings</CardTitle>
          <CardDescription className="text-xs">
            Default first-response SLA for ingested conversations when channel payload does not provide an SLA deadline.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">First-response SLA (minutes)</label>
            <Input
              className="mt-1"
              type="number"
              min={1}
              max={1440}
              value={settings.first_response_sla_minutes}
              onChange={(e) =>
                setSettings((s) => ({ ...s, first_response_sla_minutes: Number(e.target.value || 0) }))
              }
              disabled={loadingSettings || savingSettings}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={settings.enforce}
              onChange={(e) => setSettings((s) => ({ ...s, enforce: e.target.checked }))}
              disabled={loadingSettings || savingSettings}
            />
            Enforce SLA default when ingest metadata has no SLA.
          </label>
          <Button
            onClick={saveSettings}
            disabled={loadingSettings || savingSettings}
            title={savingSettings ? 'Please wait' : 'Save settings'}
          >
            {savingSettings ? 'Saving…' : loadingSettings ? 'Loading…' : 'Save SLA settings'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Queue</CardTitle>
            <CardDescription className="text-xs">Recent conversations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
            <Button variant="outline" size="sm" className="w-full mb-2" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
            {items.length === 0 && !loading && (
              <p className="text-sm text-slate-500 py-6 text-center">
                No conversations yet. Ingest messages from connected channels to populate this queue.
              </p>
            )}
            {items.map((c) => {
              const sla = slaLabel(c.sla_due_at ?? null, c.status)
              return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelected(c)
                  setOwnerInput(c.owner_user_id ?? '')
                  setTagInput((c.tags ?? []).join(', '))
                }}
                className={`w-full text-left rounded-xl border px-3 py-2 text-sm transition hover:shadow-md ${
                  selected?.id === c.id
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{c.conversation_id}</span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {c.channel}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{c.body_preview}</p>
                <div className="flex gap-1 mt-1 flex-wrap items-center">
                  <Badge variant="outline" className="text-[10px]">
                    {c.status}
                  </Badge>
                  {c.owner_user_id && (
                    <Badge variant="outline" className="text-[10px]">
                      {c.owner_user_id}
                    </Badge>
                  )}
                  {sla && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] gap-0.5 ${
                        sla.breached
                          ? 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-300'
                          : 'border-amber-200 text-amber-800 dark:border-amber-800 dark:text-amber-200'
                      }`}
                    >
                      {sla.breached ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      SLA {sla.breached ? 'breach' : sla.text}
                    </Badge>
                  )}
                  {c.sentiment && (
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {c.sentiment}
                    </Badge>
                  )}
                </div>
              </button>
              )
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm min-h-[320px]">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Thread
            </CardTitle>
            <CardDescription className="text-xs">
              {selected ? `Latest message preview · ${selected.direction}` : 'Select a conversation'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 p-3 space-y-3">
                  {loadingThread ? (
                    <div className="flex justify-center py-6 text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : threadMessages.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No messages loaded.</p>
                  ) : (
                    threadMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                            m.direction === 'outbound'
                              ? 'bg-violet-600 text-white'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p
                            className={`text-[10px] mt-1 ${m.direction === 'outbound' ? 'text-violet-200' : 'text-slate-500'}`}
                          >
                            {m.direction} · {new Date(m.occurred_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Reply (outbound)</label>
                  <textarea
                    className="w-full min-h-[88px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Type a reply…"
                  />
                  <Button
                    onClick={sendReply}
                    disabled={mutating === 'reply' || !replyBody.trim()}
                    title={mutating === 'reply' ? 'Please wait' : 'Send reply'}
                  >
                    {mutating === 'reply' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Choose a thread from the queue.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Context
            </CardTitle>
            <CardDescription className="text-xs">SLA, assign owner, and tags</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                {(() => {
                  const sla = slaLabel(selected.sla_due_at ?? null, selected.status)
                  if (!sla) return null
                  return (
                  <div
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      sla.breached
                        ? 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900'
                        : 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900'
                    }`}
                  >
                    <div className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      {sla.breached ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      First-response SLA
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      Due {sla.due} ·{' '}
                      {sla.breached
                        ? 'Breached — respond now'
                        : `${sla.text} to due time`}
                    </p>
                  </div>
                  )
                })()}
                {selected.sentiment && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sentiment: <span className="font-medium capitalize text-slate-700 dark:text-slate-200">{selected.sentiment}</span>
                  </p>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Owner user id
                  </label>
                  <Input
                    className="mt-1"
                    value={ownerInput}
                    onChange={(e) => setOwnerInput(e.target.value)}
                    placeholder="user id"
                  />
                  <Button
                    className="mt-2 w-full"
                    variant="secondary"
                    size="sm"
                    onClick={assignOwner}
                    disabled={mutating === 'assign' || !ownerInput.trim()}
                    title={mutating === 'assign' ? 'Please wait' : 'Assign owner'}
                  >
                    {mutating === 'assign' ? 'Saving…' : 'Assign'}
                  </Button>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Tags (comma-separated)
                  </label>
                  <Input
                    className="mt-1"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="priority, enterprise, …"
                  />
                  <Button
                    className="mt-2 w-full"
                    variant="outline"
                    size="sm"
                    onClick={saveTags}
                    disabled={mutating === 'tag'}
                    title={mutating === 'tag' ? 'Please wait' : 'Save tags'}
                  >
                    {mutating === 'tag' ? 'Saving…' : 'Save tags'}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a conversation to edit context.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
