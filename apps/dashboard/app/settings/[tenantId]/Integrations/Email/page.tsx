'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/lib/stores/auth'
import { usePermissions } from '@/lib/hooks/usePermissions'

type SmtpSettings = {
  host: string | null
  port: number | null
  username: string | null
  password: string | null
  fromName: string | null
  fromEmail: string | null
  useTls: boolean
  isConfigured: boolean
  updatedAt?: string | null
  diagnostics?: {
    encryptionKeyConfigured: boolean
    encryptionKeyFormatValid: boolean
  }
}

type OAuthProviderStatus = {
  provider: 'gmail' | 'outlook'
  connected: boolean
  email: string | null
  displayName: string | null
  lastSyncAt: string | null
  expiresAt: string | null
  scope: string | null
  health: 'not_connected' | 'healthy' | 'expiring_soon' | 'expired'
}

function authHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function EmailSmtpSettingsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const queryClient = useQueryClient()
  const { can } = usePermissions(tenantId)
  const canConfigure = can('admin.integrations.manage')

  const [form, setForm] = useState({
    host: '',
    port: '587',
    username: '',
    password: '',
    fromName: '',
    fromEmail: '',
    useTls: true,
  })
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [testTo, setTestTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'smtp', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/settings/smtp', { headers: authHeaders() })
      const json = (await res.json().catch(() => ({}))) as any
      if (!res.ok) throw new Error(json.error || 'Failed to load SMTP settings')
      return json as SmtpSettings
    },
    enabled: Boolean(tenantId),
    retry: false,
  })

  const { data: oauthStatus, isLoading: oauthLoading } = useQuery({
    queryKey: ['settings', 'email-oauth', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/settings/email/oauth/status', { headers: authHeaders() })
      const json = (await res.json().catch(() => ({}))) as any
      if (!res.ok) throw new Error(json.error || 'Failed to load OAuth status')
      return json as { providers: OAuthProviderStatus[] }
    },
    enabled: Boolean(tenantId),
    retry: false,
  })

  useEffect(() => {
    if (!data) return
    const timeoutId = globalThis.setTimeout(() => {
      setForm((prev) => ({
        ...prev,
        host: data.host || '',
        port: data.port != null ? String(data.port) : prev.port,
        username: data.username || '',
        password: '',
        fromName: data.fromName || '',
        fromEmail: data.fromEmail || '',
        useTls: Boolean(data.useTls),
      }))
    }, 0)
    return () => globalThis.clearTimeout(timeoutId)
  }, [data])

  const encryptionWarning = useMemo(() => {
    const d = data?.diagnostics
    if (!d) return null
    if (d.encryptionKeyConfigured && d.encryptionKeyFormatValid) return null
    return 'Server encryption is not configured. Set ENCRYPTION_KEY (64-char hex) before saving credentials.'
  }, [data])

  const save = useMutation({
    mutationFn: async () => {
      setBanner(null)
      const res = await fetch('/api/settings/smtp', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          host: form.host || null,
          port: form.port ? Number(form.port) : null,
          username: form.username || null,
          password: form.password || null,
          fromName: form.fromName || null,
          fromEmail: form.fromEmail || null,
          useTls: Boolean(form.useTls),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Failed to save SMTP settings')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'smtp', tenantId] })
      setForm((p) => ({ ...p, password: '' }))
      setBanner({ kind: 'success', message: 'SMTP settings saved.' })
    },
    onError: (e) => {
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Save failed' })
    },
  })

  const sendTest = useMutation({
    mutationFn: async () => {
      setBanner(null)
      const res = await fetch('/api/settings/smtp/test', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ to: testTo }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Test email failed')
      return json
    },
    onSuccess: () => {
      setBanner({ kind: 'success', message: 'Test email queued/sent successfully.' })
    },
    onError: (e) => {
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Test failed' })
    },
  })

  const connectOAuth = useMutation({
    mutationFn: async (provider: 'gmail' | 'outlook') => {
      setBanner(null)
      const endpoint = provider === 'gmail' ? '/api/email/gmail/auth' : '/api/email/outlook/auth'
      const res = await fetch(endpoint, { headers: authHeaders() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !(json as any).authUrl) throw new Error((json as any).error || `Failed to initiate ${provider} OAuth`)
      return (json as any).authUrl as string
    },
    onSuccess: (authUrl) => {
      window.location.href = authUrl
    },
    onError: (e) => {
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'OAuth connect failed' })
    },
  })

  const disconnectOAuth = useMutation({
    mutationFn: async (provider: 'gmail' | 'outlook') => {
      setBanner(null)
      const res = await fetch('/api/settings/email/oauth/disconnect', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ provider }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || `Failed to disconnect ${provider}`)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'email-oauth', tenantId] })
      setBanner({ kind: 'success', message: 'Provider disconnected.' })
    },
    onError: (e) => {
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Disconnect failed' })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Email (SMTP)</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Configure outbound email delivery for your workspace.</p>
      </div>

      {banner && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            banner.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100'
              : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100'
          }`}
        >
          {banner.message}
        </div>
      )}

      {encryptionWarning && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {encryptionWarning}
        </div>
      )}
      {!canConfigure && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
          You have read-only access. Integration configuration actions are disabled.
        </div>
      )}

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">SMTP configuration</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading…' : data?.isConfigured ? 'Configured' : 'Not configured'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Host</label>
              <Input disabled={!canConfigure} value={form.host} onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))} placeholder="smtp.example.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Port</label>
              <Input disabled={!canConfigure} value={form.port} onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))} placeholder="587" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Username</label>
              <Input disabled={!canConfigure} value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} placeholder="smtp-user" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Password</label>
              <Input
                type="password"
                disabled={!canConfigure}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder={data?.isConfigured ? '•••••••• (leave blank to keep existing)' : 'Enter password'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">From name</label>
              <Input disabled={!canConfigure} value={form.fromName} onChange={(e) => setForm((p) => ({ ...p, fromName: e.target.value }))} placeholder="PayAid" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">From email</label>
              <Input disabled={!canConfigure} value={form.fromEmail} onChange={(e) => setForm((p) => ({ ...p, fromEmail: e.target.value }))} placeholder="noreply@yourdomain.com" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 p-3">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Use TLS</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Recommended for port 587.</div>
            </div>
            <Switch disabled={!canConfigure} checked={form.useTls} onCheckedChange={(v) => setForm((p) => ({ ...p, useTls: v }))} />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['settings', 'smtp', tenantId] })
                setBanner(null)
              }}
              disabled={save.isPending || sendTest.isPending}
              title={save.isPending || sendTest.isPending ? 'Please wait…' : 'Refresh'}
            >
              Refresh
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={!canConfigure || save.isPending || Boolean(encryptionWarning)}
              title={!canConfigure ? 'Read-only access' : save.isPending ? 'Saving…' : encryptionWarning ? 'Fix ENCRYPTION_KEY first' : 'Save'}
            >
              {save.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Send test email</CardTitle>
          <CardDescription>Verify delivery using the currently configured SMTP settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Recipient</label>
              <Input disabled={!canConfigure} value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@company.com" />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => sendTest.mutate()}
                disabled={!canConfigure || sendTest.isPending || !data?.isConfigured}
                title={
                  !canConfigure ? 'Read-only access' : !data?.isConfigured ? 'Configure SMTP first' : sendTest.isPending ? 'Sending…' : 'Send test email'
                }
              >
                {sendTest.isPending ? 'Sending…' : 'Send test'}
              </Button>
            </div>
          </div>
          {!data?.isConfigured && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              SMTP is not configured yet. Save credentials above, then send a test email.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Email OAuth providers</CardTitle>
          <CardDescription>Connect Gmail or Outlook for mailbox sync and provider-based sending.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(oauthStatus?.providers || (['gmail', 'outlook'] as const).map((p) => ({ provider: p, connected: false, email: null, displayName: null, lastSyncAt: null, expiresAt: null, scope: null, health: 'not_connected' as const }))).map((provider) => {
            const label = provider.provider === 'gmail' ? 'Gmail' : 'Outlook'
            const healthColor =
              provider.health === 'healthy'
                ? 'text-emerald-700 dark:text-emerald-300'
                : provider.health === 'expiring_soon'
                ? 'text-amber-700 dark:text-amber-300'
                : provider.health === 'expired'
                ? 'text-rose-700 dark:text-rose-300'
                : 'text-slate-600 dark:text-slate-400'

            return (
              <div key={provider.provider} className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</div>
                    <div className={`text-xs ${healthColor}`}>
                      {oauthLoading ? 'Loading…' : provider.connected ? `Connected (${provider.health.replace('_', ' ')})` : 'Not connected'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {provider.displayName || provider.email || 'No account linked'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Last sync: {provider.lastSyncAt || '—'} · Token expiry: {provider.expiresAt || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => connectOAuth.mutate(provider.provider)}
                      disabled={!canConfigure || connectOAuth.isPending || disconnectOAuth.isPending}
                      title={!canConfigure ? 'Read-only access' : connectOAuth.isPending ? 'Please wait…' : provider.connected ? `Reconnect ${label}` : `Connect ${label}`}
                    >
                      {connectOAuth.isPending ? 'Please wait…' : provider.connected ? 'Reconnect' : 'Connect'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => disconnectOAuth.mutate(provider.provider)}
                      disabled={!canConfigure || !provider.connected || disconnectOAuth.isPending || connectOAuth.isPending}
                      title={!canConfigure ? 'Read-only access' : !provider.connected ? 'Nothing to disconnect' : disconnectOAuth.isPending ? 'Please wait…' : `Disconnect ${label}`}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

