'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/stores/auth'
import { usePermissions } from '@/lib/hooks/usePermissions'

type ProviderStatus = {
  provider: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'youtube'
  connected: boolean
  viaOAuth: boolean
  viaSocialAccount: boolean
  providerName: string | null
  providerEmail: string | null
  expiresAt: string | null
  lastActivityAt: string | null
  health?: 'not_connected' | 'healthy' | 'expiring_soon' | 'expired' | 'missing_scope'
}

type ProviderGuide = {
  connectMethod: string
  tokenSource: string
  steps: string[]
  docsUrl: string
}

const PROVIDER_GUIDES: Record<ProviderStatus['provider'], ProviderGuide> = {
  linkedin: {
    connectMethod: 'OAuth (recommended)',
    tokenSource: 'No manual token needed for normal setup; use Connect/Reconnect button.',
    steps: [
      'Click Connect and sign in to your LinkedIn account.',
      'Approve requested permissions for posting and profile access.',
      'Return here and use Test to verify connection.',
    ],
    docsUrl: 'https://learn.microsoft.com/linkedin/shared/authentication/authentication',
  },
  facebook: {
    connectMethod: 'Manual token',
    tokenSource: 'Meta Graph API Explorer or your Facebook app token tools.',
    steps: [
      'Open Graph API Explorer and sign in with the target Facebook account/page role.',
      'Generate a User/Page access token with publish permissions.',
      'Paste token here, optionally set account name/email/expiry, then click Connect token.',
    ],
    docsUrl: 'https://developers.facebook.com/docs/graph-api/get-started',
  },
  instagram: {
    connectMethod: 'Manual token',
    tokenSource: 'Meta Graph API / Instagram Graph API token flow.',
    steps: [
      'Ensure Instagram Business/Creator account is linked to a Facebook Page.',
      'Generate token through Meta developer flow with required Instagram scopes.',
      'Paste token and click Connect token, then run Test.',
    ],
    docsUrl: 'https://developers.facebook.com/docs/instagram-platform',
  },
  twitter: {
    connectMethod: 'Manual token',
    tokenSource: 'X Developer Portal app credentials and OAuth token flow.',
    steps: [
      'Create/configure an app in X Developer Portal.',
      'Generate an access token with post/write permissions.',
      'Paste token here and click Connect token, then use Test.',
    ],
    docsUrl: 'https://developer.x.com/en/docs/authentication/oauth-2-0',
  },
  youtube: {
    connectMethod: 'Manual token or refresh',
    tokenSource: 'Google OAuth token for YouTube Data API.',
    steps: [
      'Enable YouTube Data API in your Google Cloud project.',
      'Generate OAuth token that includes youtube.upload scope.',
      'Paste token here and connect, or use Refresh token if already connected.',
    ],
    docsUrl: 'https://developers.google.com/youtube/v3/guides/authentication',
  },
}

function authHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function SocialSettingsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const queryClient = useQueryClient()
  const { can } = usePermissions(tenantId)
  const canConfigure = can('admin.integrations.manage')
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [tokenForms, setTokenForms] = useState<
    Record<'facebook' | 'instagram' | 'twitter' | 'youtube', { accessToken: string; providerName: string; providerEmail: string; expiresInSeconds: string }>
  >({
    facebook: { accessToken: '', providerName: '', providerEmail: '', expiresInSeconds: '' },
    instagram: { accessToken: '', providerName: '', providerEmail: '', expiresInSeconds: '' },
    twitter: { accessToken: '', providerName: '', providerEmail: '', expiresInSeconds: '' },
    youtube: { accessToken: '', providerName: '', providerEmail: '', expiresInSeconds: '' },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'social', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/settings/social', { headers: authHeaders() })
      const json = (await res.json().catch(() => ({}))) as any
      if (!res.ok) throw new Error(json.error || 'Failed to load social settings')
      return json as { providers: ProviderStatus[] }
    },
    enabled: Boolean(tenantId),
  })

  const map = useMemo(() => {
    const m = new Map<string, ProviderStatus>()
    for (const p of data?.providers || []) m.set(p.provider, p)
    return m
  }, [data])

  const connectLinkedIn = useMutation({
    mutationFn: async () => {
      setBanner(null)
      const res = await fetch('/api/integrations/linkedin/auth', { headers: authHeaders() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !(json as any)?.data?.authUrl) {
        throw new Error((json as any).error || 'Failed to create LinkedIn auth URL')
      }
      return (json as any).data.authUrl as string
    },
    onSuccess: (authUrl) => {
      window.location.href = authUrl
    },
    onError: (e) => setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Connect failed' }),
  })

  const connectWithToken = useMutation({
    mutationFn: async (payload: {
      provider: 'facebook' | 'instagram' | 'twitter'
      accessToken: string
      providerName?: string
      providerEmail?: string
      expiresInSeconds?: number
    }) => {
      setBanner(null)

      const res = await fetch('/api/settings/social/connect', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          provider: payload.provider,
          accessToken: payload.accessToken,
          providerName: payload.providerName,
          providerEmail: payload.providerEmail,
          expiresInSeconds: payload.expiresInSeconds,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Connect failed')
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'social', tenantId] })
      setBanner({ kind: 'success', message: 'Provider connected with token.' })
      setTokenForms((prev) => ({
        ...prev,
        [variables.provider]: { accessToken: '', providerName: '', providerEmail: '', expiresInSeconds: '' },
      }))
    },
    onError: (e) => setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Connect failed' }),
  })

  const disconnect = useMutation({
    mutationFn: async (provider: string) => {
      setBanner(null)
      const res = await fetch('/api/settings/social/disconnect', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ provider }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Disconnect failed')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'social', tenantId] })
      setBanner({ kind: 'success', message: 'Provider disconnected.' })
    },
    onError: (e) => setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Disconnect failed' }),
  })

  const refreshToken = useMutation({
    mutationFn: async (provider: string) => {
      setBanner(null)
      const res = await fetch('/api/settings/social/refresh', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ provider }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const err = (json as any).error || 'Token refresh failed'
        const guidance = (json as any).guidance ? ` ${(json as any).guidance}` : ''
        throw new Error(`${err}${guidance}`)
      }
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'social', tenantId] })
      setBanner({ kind: 'success', message: 'Token refreshed successfully.' })
    },
    onError: (e) => setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Refresh failed' }),
  })

  const testConnection = useMutation({
    mutationFn: async (provider: string) => {
      setBanner(null)
      const res = await fetch(`/api/settings/social/test?provider=${encodeURIComponent(provider)}`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Connection test failed')
    },
    onSuccess: () => setBanner({ kind: 'success', message: 'Connection test successful.' }),
    onError: (e) => setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Test failed' }),
  })

  const providers: Array<{ id: ProviderStatus['provider']; label: string; enabled: boolean }> = [
    { id: 'linkedin', label: 'LinkedIn', enabled: true },
    { id: 'facebook', label: 'Facebook', enabled: true },
    { id: 'instagram', label: 'Instagram', enabled: true },
    { id: 'twitter', label: 'Twitter/X', enabled: true },
    { id: 'youtube', label: 'YouTube', enabled: true },
  ]

  const healthBadge = (health: ProviderStatus['health']) => {
    switch (health) {
      case 'healthy':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
      case 'expiring_soon':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
      case 'expired':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
      case 'missing_scope':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  const healthLabel = (health: ProviderStatus['health']) => {
    switch (health) {
      case 'healthy':
        return 'Healthy'
      case 'expiring_soon':
        return 'Expiring soon'
      case 'expired':
        return 'Expired'
      case 'missing_scope':
        return 'Missing scope'
      default:
        return 'Not connected'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Social media connections</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Connect social providers and verify account access for publishing and analytics.
        </p>
      </div>

      {banner && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${banner.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100' : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100'}`}>
          {banner.message}
        </div>
      )}
      {!canConfigure && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
          You have read-only access. Integration configuration actions are disabled.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p) => {
          const st = map.get(p.id)
          const connected = Boolean(st?.connected)
          return (
            <Card key={p.id} className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{p.label}</CardTitle>
                <CardDescription>
                  {isLoading ? 'Loading…' : connected ? 'Connected' : 'Not connected'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${healthBadge(st?.health)}`}>
                    {healthLabel(st?.health)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {st?.providerName ? `Account: ${st.providerName}` : 'No account linked'}
                  {st?.providerEmail ? ` · ${st.providerEmail}` : ''}
                </div>
                {st?.health === 'missing_scope' && p.id === 'youtube' ? (
                  <div className="text-xs text-violet-700 dark:text-violet-300">
                    Token is missing YouTube upload scope. Reconnect with <code>youtube.upload</code>.
                  </div>
                ) : null}
                {st?.health === 'expired' ? (
                  <div className="text-xs text-rose-700 dark:text-rose-300">
                    Token expired. Reconnect or refresh token if provider supports it.
                  </div>
                ) : null}
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Last activity: {st?.lastActivityAt || '—'}
                </div>
                <details className="rounded-lg border border-slate-200/80 dark:border-slate-800 px-3 py-2 bg-slate-50/60 dark:bg-slate-900/30">
                  <summary className="cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200">
                    How to connect {p.label}
                  </summary>
                  <div className="mt-2 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      <span className="font-semibold">Method:</span>{' '}
                      {PROVIDER_GUIDES[p.id].connectMethod}
                    </p>
                    <p>
                      <span className="font-semibold">Access token source:</span>{' '}
                      {PROVIDER_GUIDES[p.id].tokenSource}
                    </p>
                    <ol className="list-decimal pl-4 space-y-1">
                      {PROVIDER_GUIDES[p.id].steps.map((step) => (
                        <li key={`${p.id}-${step}`}>{step}</li>
                      ))}
                    </ol>
                    <a
                      href={PROVIDER_GUIDES[p.id].docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-violet-700 dark:text-violet-300 underline underline-offset-2"
                    >
                      Open official setup guide
                    </a>
                  </div>
                </details>
                <div className="rounded-lg border border-amber-200/80 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">Common token issues</p>
                  <ul className="mt-1 list-disc pl-4 space-y-1 text-xs text-amber-800 dark:text-amber-300">
                    <li>
                      <span className="font-medium">Invalid token:</span> Re-generate from provider console and paste again.
                    </li>
                    <li>
                      <span className="font-medium">Expired token:</span> Use Refresh token (if available) or reconnect.
                    </li>
                    <li>
                      <span className="font-medium">Missing scope:</span> Reconnect and grant publish/upload permissions.
                    </li>
                  </ul>
                </div>
                <div className="flex items-center gap-2">
                  {p.id === 'linkedin' ? (
                    <Button
                      onClick={() => connectLinkedIn.mutate()}
                      disabled={!canConfigure || connectLinkedIn.isPending}
                      title={!canConfigure ? 'Read-only access' : connectLinkedIn.isPending ? 'Please wait…' : connected ? 'Reconnect LinkedIn' : 'Connect LinkedIn'}
                    >
                      {connectLinkedIn.isPending ? 'Please wait…' : connected ? 'Reconnect' : 'Connect'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        const f = tokenForms[p.id]
                        const expires = f.expiresInSeconds ? Number(f.expiresInSeconds) : undefined
                        if (!f.accessToken.trim()) {
                          setBanner({ kind: 'error', message: `Please enter ${p.label} access token.` })
                          return
                        }
                        if (f.expiresInSeconds && !Number.isFinite(expires)) {
                          setBanner({ kind: 'error', message: `Expiry seconds must be a valid number for ${p.label}.` })
                          return
                        }
                        connectWithToken.mutate({
                          provider: p.id as 'facebook' | 'instagram' | 'twitter' | 'youtube',
                          accessToken: f.accessToken.trim(),
                          providerName: f.providerName.trim() || undefined,
                          providerEmail: f.providerEmail.trim() || undefined,
                          expiresInSeconds: expires,
                        })
                      }}
                      disabled={!canConfigure || connectWithToken.isPending}
                      title={!canConfigure ? 'Read-only access' : connectWithToken.isPending ? 'Please wait…' : connected ? `Update ${p.label} token` : `Connect ${p.label} token`}
                    >
                      {connectWithToken.isPending ? 'Please wait…' : connected ? 'Update token' : 'Connect token'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => testConnection.mutate(p.id)}
                    disabled={!canConfigure || !connected || testConnection.isPending}
                    title={!canConfigure ? 'Read-only access' : !connected ? 'Connect provider first' : testConnection.isPending ? 'Testing…' : 'Test connection'}
                  >
                    {testConnection.isPending ? 'Testing…' : 'Test'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => disconnect.mutate(p.id)}
                    disabled={!canConfigure || !connected || disconnect.isPending}
                    title={!canConfigure ? 'Read-only access' : !connected ? 'Nothing to disconnect' : disconnect.isPending ? 'Please wait…' : 'Disconnect'}
                  >
                    Disconnect
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => refreshToken.mutate(p.id)}
                    disabled={!canConfigure || !connected || (p.id !== 'linkedin' && p.id !== 'youtube') || refreshToken.isPending}
                    title={
                      !canConfigure
                        ? 'Read-only access'
                        : !connected
                        ? 'Connect provider first'
                        : p.id !== 'linkedin' && p.id !== 'youtube'
                        ? 'Refresh flow coming soon for this provider'
                        : refreshToken.isPending
                        ? 'Please wait…'
                        : 'Refresh token'
                    }
                  >
                    {refreshToken.isPending ? 'Please wait…' : 'Refresh token'}
                  </Button>
                </div>
                {p.id !== 'linkedin' && (
                  <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 space-y-2">
                    <div className="text-xs font-medium text-slate-900 dark:text-slate-100">Manual token connect</div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor={`${p.id}-token`} className="text-xs">Access token</Label>
                        <Input
                          id={`${p.id}-token`}
                          type="password"
                          disabled={!canConfigure || connectWithToken.isPending}
                          value={tokenForms[p.id].accessToken}
                          onChange={(e) =>
                            setTokenForms((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], accessToken: e.target.value },
                            }))
                          }
                          placeholder={`Paste ${p.label} access token`}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`${p.id}-name`} className="text-xs">Account name (optional)</Label>
                          <Input
                            id={`${p.id}-name`}
                            disabled={!canConfigure || connectWithToken.isPending}
                            value={tokenForms[p.id].providerName}
                            onChange={(e) =>
                              setTokenForms((prev) => ({
                                ...prev,
                                [p.id]: { ...prev[p.id], providerName: e.target.value },
                              }))
                            }
                            placeholder="Display name"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`${p.id}-email`} className="text-xs">Account email (optional)</Label>
                          <Input
                            id={`${p.id}-email`}
                            disabled={!canConfigure || connectWithToken.isPending}
                            value={tokenForms[p.id].providerEmail}
                            onChange={(e) =>
                              setTokenForms((prev) => ({
                                ...prev,
                                [p.id]: { ...prev[p.id], providerEmail: e.target.value },
                              }))
                            }
                            placeholder="account@example.com"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`${p.id}-exp`} className="text-xs">Expiry in seconds (optional)</Label>
                        <Input
                          id={`${p.id}-exp`}
                          disabled={!canConfigure || connectWithToken.isPending}
                          value={tokenForms[p.id].expiresInSeconds}
                          onChange={(e) =>
                            setTokenForms((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], expiresInSeconds: e.target.value },
                            }))
                          }
                          placeholder="5184000"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

