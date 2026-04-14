'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/auth'
import { usePermissions } from '@/lib/hooks/usePermissions'

type WahaSettings = {
  baseUrl: string | null
  apiKey: string | null
  defaultInstance: string | null
  isConfigured: boolean
  operationalConnected?: boolean
  connectedAccounts?: number
  lastEventAt?: string | null
  lastTestAt?: string | null
  lastTestOk?: boolean | null
  lastTestError?: string | null
  diagnostics?: {
    encryptionKeyConfigured: boolean
    encryptionKeyFormatValid: boolean
  }
}

function authHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function WhatsAppWahaSettingsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const queryClient = useQueryClient()
  const { can } = usePermissions(tenantId)
  const canConfigure = can('admin.integrations.manage')

  const [form, setForm] = useState({
    baseUrl: '',
    apiKey: '',
    defaultInstance: '',
  })
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'waha', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/settings/waha', { headers: authHeaders() })
      const json = (await res.json().catch(() => ({}))) as any
      if (!res.ok) throw new Error(json.error || 'Failed to load WAHA settings')
      return json as WahaSettings
    },
    enabled: Boolean(tenantId),
    retry: false,
  })

  useEffect(() => {
    if (!data) return
    setForm({
      baseUrl: data.baseUrl || '',
      apiKey: '',
      defaultInstance: data.defaultInstance || '',
    })
  }, [data])

  const encryptionWarning = useMemo(() => {
    const d = data?.diagnostics
    if (!d) return null
    if (d.encryptionKeyConfigured && d.encryptionKeyFormatValid) return null
    return 'Server encryption is not configured. Set ENCRYPTION_KEY (64-char hex) before saving secrets.'
  }, [data])

  const save = useMutation({
    mutationFn: async () => {
      setBanner(null)
      const res = await fetch('/api/settings/waha', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          baseUrl: form.baseUrl || null,
          apiKey: form.apiKey || null,
          defaultInstance: form.defaultInstance || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Failed to save WAHA settings')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'waha', tenantId] })
      setForm((p) => ({ ...p, apiKey: '' }))
      setBanner({ kind: 'success', message: 'WAHA settings saved.' })
    },
    onError: (e) => {
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Save failed' })
    },
  })

  const test = useMutation({
    mutationFn: async () => {
      setBanner(null)
      const res = await fetch('/api/settings/waha/test', { method: 'POST', headers: authHeaders() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'WAHA test failed')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'waha', tenantId] })
      setBanner({ kind: 'success', message: 'WAHA connection OK.' })
    },
    onError: (e) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'waha', tenantId] })
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Test failed' })
    },
  })

  const statusLabel = isLoading ? 'Loading…' : data?.isConfigured ? 'Configured' : 'Not configured'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">WhatsApp (WAHA)</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Connect your WAHA server for WhatsApp Web sessions and messaging.
        </p>
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
          <CardTitle className="text-base">Connection</CardTitle>
          <CardDescription>{statusLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">WAHA base URL</label>
              <Input
                value={form.baseUrl}
                disabled={!canConfigure}
                onChange={(e) => setForm((p) => ({ ...p, baseUrl: e.target.value }))}
                placeholder="http://localhost:3000"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Example: `http://127.0.0.1:3000` or your server URL where WAHA is running.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Default instance</label>
              <Input
                value={form.defaultInstance}
                disabled={!canConfigure}
                onChange={(e) => setForm((p) => ({ ...p, defaultInstance: e.target.value }))}
                placeholder="tenant1-main"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Optional. Used as a default when creating sessions.</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100">WAHA API key</label>
            <Input
              type="password"
              disabled={!canConfigure}
              value={form.apiKey}
              onChange={(e) => setForm((p) => ({ ...p, apiKey: e.target.value }))}
              placeholder={data?.apiKey ? '•••••••• (leave blank to keep existing)' : 'Enter API key'}
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['settings', 'waha', tenantId] })
                setBanner(null)
              }}
              disabled={save.isPending || test.isPending}
              title={save.isPending || test.isPending ? 'Please wait…' : 'Refresh'}
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
            <Button
              variant="secondary"
              onClick={() => test.mutate()}
              disabled={!canConfigure || test.isPending || !data?.isConfigured}
              title={!canConfigure ? 'Read-only access' : !data?.isConfigured ? 'Configure WAHA first' : test.isPending ? 'Testing…' : 'Test connection'}
            >
              {test.isPending ? 'Testing…' : 'Test connection'}
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 text-sm">
            <div className="flex flex-col gap-1">
              <div className="text-slate-900 dark:text-slate-100 font-medium">Operational status</div>
              <div className="text-slate-600 dark:text-slate-400">
                {data?.operationalConnected ? 'Connected' : 'Disconnected'}
                {typeof data?.connectedAccounts === 'number' ? ` · ${data.connectedAccounts} active account(s)` : ''}
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                Last event: {data?.lastEventAt || '—'}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 text-sm">
            <div className="flex flex-col gap-1">
              <div className="text-slate-900 dark:text-slate-100 font-medium">Last test</div>
              <div className="text-slate-600 dark:text-slate-400">
                {data?.lastTestAt ? data.lastTestAt : '—'}
                {data?.lastTestOk === true ? ' · OK' : data?.lastTestOk === false ? ' · Failed' : ''}
              </div>
              {data?.lastTestError ? (
                <div className="text-rose-700 dark:text-rose-300">{data.lastTestError}</div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

