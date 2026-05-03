'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/stores/auth'
import { usePermissions } from '@/lib/hooks/usePermissions'

type TelephonySettings = {
  provider: 'none' | 'twilio' | 'exotel'
  accountSid: string | null
  authToken: string | null
  apiKey: string | null
  apiSecret: string | null
  apiBaseUrl: string | null
  fromNumber: string | null
  webhookBaseUrl: string | null
  webhookVerification?: {
    expectedWebhookUrl: string
    lastWebhookAt: string | null
    lastWebhookProvider: string | null
    lastWebhookCallSid: string | null
    signatureVerification: 'active' | 'missing_secret' | 'provider_specific' | 'not_applicable'
    lastSignatureValid: boolean | null
  }
  isConfigured: boolean
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

export default function TelephonySettingsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const queryClient = useQueryClient()
  const { can } = usePermissions(tenantId)
  const canConfigure = can('admin.integrations.manage')

  const [form, setForm] = useState({
    provider: 'none' as 'none' | 'twilio' | 'exotel',
    accountSid: '',
    authToken: '',
    apiKey: '',
    apiSecret: '',
    apiBaseUrl: '',
    fromNumber: '',
    webhookBaseUrl: '',
  })
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [dryRunPhone, setDryRunPhone] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'telephony', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/settings/telephony', { headers: authHeaders() })
      const json = (await res.json().catch(() => ({}))) as any
      if (!res.ok) throw new Error(json.error || 'Failed to load telephony settings')
      return json as TelephonySettings
    },
    enabled: Boolean(tenantId),
    retry: false,
  })

  useEffect(() => {
    if (!data) return
    const timeoutId = globalThis.setTimeout(() => {
      setForm((p) => ({
        ...p,
        provider: (data.provider || 'none') as 'none' | 'twilio' | 'exotel',
        accountSid: data.accountSid || '',
        authToken: '',
        apiKey: '',
        apiSecret: '',
        apiBaseUrl: data.apiBaseUrl || '',
        fromNumber: data.fromNumber || '',
        webhookBaseUrl: data.webhookBaseUrl || '',
      }))
    }, 0)
    return () => globalThis.clearTimeout(timeoutId)
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
      const res = await fetch('/api/settings/telephony', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          provider: form.provider,
          accountSid: form.accountSid || null,
          authToken: form.authToken || null,
          apiKey: form.apiKey || null,
          apiSecret: form.apiSecret || null,
          apiBaseUrl: form.apiBaseUrl || null,
          fromNumber: form.fromNumber || null,
          webhookBaseUrl: form.webhookBaseUrl || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Failed to save telephony settings')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'telephony', tenantId] })
      setForm((p) => ({ ...p, authToken: '', apiSecret: '', apiKey: '' }))
      setBanner({ kind: 'success', message: 'Telephony settings saved.' })
    },
    onError: (e) => setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Save failed' }),
  })

  const test = useMutation({
    mutationFn: async () => {
      setBanner(null)
      const res = await fetch('/api/settings/telephony/test', { method: 'POST', headers: authHeaders() })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Connection test failed')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'telephony', tenantId] })
      setBanner({ kind: 'success', message: 'Telephony provider connection OK.' })
    },
    onError: (e) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'telephony', tenantId] })
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Test failed' })
    },
  })

  const dryRunTestCall = useMutation({
    mutationFn: async () => {
      setBanner(null)
      const res = await fetch('/api/settings/telephony/test-call', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ toPhone: dryRunPhone }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((json as any).error || 'Dry-run test call failed')
      return json
    },
    onSuccess: () => {
      setBanner({ kind: 'success', message: 'Dry-run test call completed (no outbound call placed).' })
    },
    onError: (e) => {
      setBanner({ kind: 'error', message: e instanceof Error ? e.message : 'Dry-run failed' })
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Telephony</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Configure provider credentials for call initiation and webhook handling.</p>
      </div>

      {banner && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${banner.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100' : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100'}`}>
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
          <CardTitle className="text-base">Provider setup</CardTitle>
          <CardDescription>{isLoading ? 'Loading…' : data?.isConfigured ? 'Configured' : 'Not configured'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Provider</label>
            <select
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              disabled={!canConfigure}
              value={form.provider}
              onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value as 'none' | 'twilio' | 'exotel' }))}
            >
              <option value="none">None</option>
              <option value="twilio">Twilio</option>
              <option value="exotel">Exotel</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Account SID</label>
              <Input disabled={!canConfigure} value={form.accountSid} onChange={(e) => setForm((p) => ({ ...p, accountSid: e.target.value }))} placeholder="ACxxxxxxxxxxxx" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Auth token</label>
              <Input disabled={!canConfigure} type="password" value={form.authToken} onChange={(e) => setForm((p) => ({ ...p, authToken: e.target.value }))} placeholder="••••••••" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">API key (optional)</label>
              <Input disabled={!canConfigure} value={form.apiKey} onChange={(e) => setForm((p) => ({ ...p, apiKey: e.target.value }))} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">API secret (optional)</label>
              <Input disabled={!canConfigure} type="password" value={form.apiSecret} onChange={(e) => setForm((p) => ({ ...p, apiSecret: e.target.value }))} placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Provider API base URL</label>
              <Input disabled={!canConfigure} value={form.apiBaseUrl} onChange={(e) => setForm((p) => ({ ...p, apiBaseUrl: e.target.value }))} placeholder="Optional (default provider URL used)" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">From number</label>
              <Input disabled={!canConfigure} value={form.fromNumber} onChange={(e) => setForm((p) => ({ ...p, fromNumber: e.target.value }))} placeholder="+91xxxxxxxxxx" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Webhook base URL</label>
            <Input disabled={!canConfigure} value={form.webhookBaseUrl} onChange={(e) => setForm((p) => ({ ...p, webhookBaseUrl: e.target.value }))} placeholder="https://your-app.com" />
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 text-sm">
            <div className="text-slate-900 dark:text-slate-100 font-medium">Last test</div>
            <div className="text-slate-600 dark:text-slate-400">
              {data?.lastTestAt || '—'}
              {data?.lastTestOk === true ? ' · OK' : data?.lastTestOk === false ? ' · Failed' : ''}
            </div>
            {data?.lastTestError ? <div className="text-rose-700 dark:text-rose-300">{data.lastTestError}</div> : null}
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 text-sm">
            <div className="text-slate-900 dark:text-slate-100 font-medium">Webhook verification</div>
            <div className="text-slate-600 dark:text-slate-400">Expected URL: {data?.webhookVerification?.expectedWebhookUrl || '—'}</div>
            <div className="text-slate-600 dark:text-slate-400">
              Last webhook: {data?.webhookVerification?.lastWebhookAt || '—'}
              {data?.webhookVerification?.lastWebhookProvider ? ` · ${data.webhookVerification.lastWebhookProvider}` : ''}
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              Signature verification: {data?.webhookVerification?.signatureVerification || 'not_applicable'}
              {data?.webhookVerification?.lastSignatureValid === true ? ' (last: valid)' : data?.webhookVerification?.lastSignatureValid === false ? ' (last: invalid)' : ''}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 text-sm space-y-2">
            <div className="text-slate-900 dark:text-slate-100 font-medium">Safe dry-run test call</div>
            <div className="text-slate-600 dark:text-slate-400">
              Validates call path and logs an internal call record without placing an external call.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Test phone number</label>
                <Input disabled={!canConfigure} value={dryRunPhone} onChange={(e) => setDryRunPhone(e.target.value)} placeholder="+91xxxxxxxxxx" />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => dryRunTestCall.mutate()}
                  disabled={!canConfigure || !data?.isConfigured || !dryRunPhone || dryRunTestCall.isPending}
                  title={!canConfigure ? 'Read-only access' : !data?.isConfigured ? 'Configure telephony first' : dryRunTestCall.isPending ? 'Please wait…' : 'Run dry-run'}
                >
                  {dryRunTestCall.isPending ? 'Please wait…' : 'Run dry-run'}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['settings', 'telephony', tenantId] })} disabled={save.isPending || test.isPending} title={save.isPending || test.isPending ? 'Please wait…' : 'Refresh'}>Refresh</Button>
            <Button onClick={() => save.mutate()} disabled={!canConfigure || save.isPending || Boolean(encryptionWarning)} title={!canConfigure ? 'Read-only access' : save.isPending ? 'Saving…' : encryptionWarning ? 'Fix ENCRYPTION_KEY first' : 'Save'}>
              {save.isPending ? 'Saving…' : 'Save changes'}
            </Button>
            <Button variant="secondary" onClick={() => test.mutate()} disabled={!canConfigure || test.isPending || !data?.isConfigured || dryRunTestCall.isPending} title={!canConfigure ? 'Read-only access' : !data?.isConfigured ? 'Configure telephony first' : test.isPending ? 'Testing…' : 'Test connection'}>
              {test.isPending ? 'Testing…' : 'Test connection'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

