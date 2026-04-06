'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Link2, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'

export default function BillingPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const queryClient = useQueryClient()

  const [origin, setOrigin] = useState('')
  const webhookUrl = useMemo(() => (origin ? `${origin}/api/payments/webhook` : ''), [origin])

  const [gatewayForm, setGatewayForm] = useState({
    payaidApiKey: '',
    payaidSalt: '',
    payaidBaseUrl: '',
    isActive: false,
    testMode: false,
  })
  const [showSecrets, setShowSecrets] = useState(false)
  const [gatewayError, setGatewayError] = useState('')
  const [gatewaySuccess, setGatewaySuccess] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [])

  const { data: gatewaySettings, isLoading: gatewayLoading } = useQuery({
    queryKey: ['settings', 'payment-gateway'],
    queryFn: async () => {
      const res = await fetch('/api/settings/payment-gateway', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to fetch payment gateway settings')
      return res.json()
    },
  })

  const { data: tenantSettings } = useQuery({
    queryKey: ['settings', 'tenant'],
    queryFn: async () => {
      const res = await fetch('/api/settings/tenant', { headers: getAuthHeaders() })
      if (!res.ok) return null
      return res.json()
    },
  })

  const diagnostics = useMemo(() => {
    const apiKeyLooksPresent = Boolean(
      gatewayForm.payaidApiKey && (gatewayForm.payaidApiKey.includes('...') || gatewayForm.payaidApiKey.trim().length > 0)
    )
    const saltLooksPresent = Boolean(
      gatewayForm.payaidSalt &&
        (gatewayForm.payaidSalt === '••••••••' || gatewayForm.payaidSalt.trim().length > 0)
    )
    const baseUrlValid =
      !gatewayForm.payaidBaseUrl ||
      /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(gatewayForm.payaidBaseUrl.trim())
    const serverEncryptionConfigured = Boolean(gatewaySettings?.diagnostics?.encryptionKeyConfigured)
    const readyForActiveGateway = !gatewayForm.isActive || (apiKeyLooksPresent && saltLooksPresent && baseUrlValid)
    const canSave = serverEncryptionConfigured && baseUrlValid && readyForActiveGateway

    return {
      apiKeyLooksPresent,
      saltLooksPresent,
      baseUrlValid,
      serverEncryptionConfigured,
      readyForActiveGateway,
      canSave,
    }
  }, [gatewayForm, gatewaySettings])

  useEffect(() => {
    if (!gatewaySettings) return
    setGatewayForm((prev) => ({
      ...prev,
      // Masked values from server; allow user to click "Edit secrets" to fill real ones.
      payaidApiKey: gatewaySettings.payaidApiKey || '',
      payaidSalt: gatewaySettings.payaidSalt || '',
      payaidBaseUrl: gatewaySettings.payaidBaseUrl || '',
      isActive: gatewaySettings.isActive || false,
      testMode: gatewaySettings.testMode || false,
    }))
  }, [gatewaySettings])

  const saveGateway = useMutation({
    mutationFn: async () => {
      setGatewayError('')
      setGatewaySuccess('')

      const payload: any = {
        isActive: gatewayForm.isActive,
        testMode: gatewayForm.testMode,
        payaidBaseUrl: gatewayForm.payaidBaseUrl,
      }

      // Don't accidentally persist masked placeholders
      if (gatewayForm.payaidApiKey && !gatewayForm.payaidApiKey.includes('...')) payload.payaidApiKey = gatewayForm.payaidApiKey
      if (gatewayForm.payaidSalt && gatewayForm.payaidSalt !== '••••••••') payload.payaidSalt = gatewayForm.payaidSalt

      const res = await fetch('/api/settings/payment-gateway', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || json.message || 'Failed to update payment gateway')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'payment-gateway'] })
      setGatewaySuccess('Payment gateway settings updated.')
      setShowSecrets(false)
      setTimeout(() => setGatewaySuccess(''), 4000)
    },
    onError: (err: unknown) => {
      setGatewayError(err instanceof Error ? err.message : 'Failed to update payment gateway')
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Billing</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Plan, payment method, and invoices</p>
      </div>
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CreditCard className="w-5 h-5" />
            Subscription
          </CardTitle>
          <CardDescription>Manage your plan and payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Plan</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {tenantSettings?.plan ? String(tenantSettings.plan) : '—'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Max users</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {tenantSettings?.maxUsers != null ? String(tenantSettings.maxUsers) : '—'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Period end</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {tenantSettings?.currentPeriodEnd ? new Date(tenantSettings.currentPeriodEnd).toLocaleDateString('en-IN') : '—'}
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Billing actions can be wired to your payment provider. For now, this page shows your current workspace plan and gateway setup.
          </p>
          <Button variant="outline" asChild>
            <a href={`/settings/${tenantId}`}>Back to Settings</a>
          </Button>
        </CardContent>
      </Card>

      <Card id="gateway" className="border-slate-200 dark:border-slate-800 scroll-mt-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <ShieldCheck className="w-5 h-5" />
            Payment Gateway
          </CardTitle>
          <CardDescription>Enable payment links for invoices and customer portal payments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {gatewayError && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
              {gatewayError}
            </div>
          )}
          {gatewaySuccess && (
            <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 p-3 text-sm text-green-700 dark:text-green-300">
              {gatewaySuccess}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-2">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Gateway diagnostics</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className={diagnostics.serverEncryptionConfigured ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                {diagnostics.serverEncryptionConfigured ? 'OK' : 'Missing'}: ENCRYPTION_KEY (server)
              </div>
              <div className={diagnostics.baseUrlValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                {diagnostics.baseUrlValid ? 'OK' : 'Invalid'}: Base URL format
              </div>
              <div className={diagnostics.apiKeyLooksPresent ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}>
                {diagnostics.apiKeyLooksPresent ? 'OK' : 'Missing'}: API key present
              </div>
              <div className={diagnostics.saltLooksPresent ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}>
                {diagnostics.saltLooksPresent ? 'OK' : 'Missing'}: SALT present
              </div>
            </div>
            {!diagnostics.serverEncryptionConfigured && (
              <div className="text-xs text-red-700 dark:text-red-300">
                Set a valid 64-char hex ENCRYPTION_KEY in production env vars, then redeploy.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Webhook URL</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Use this in PayAid Payments to receive status updates.</div>
              </div>
              <div className="flex items-center gap-2">
                <Input value={webhookUrl || '—'} readOnly className="w-full sm:w-[420px]" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!webhookUrl}
                  onClick={async () => {
                    if (!webhookUrl) return
                    await navigator.clipboard.writeText(webhookUrl)
                    setGatewaySuccess('Webhook URL copied.')
                    setTimeout(() => setGatewaySuccess(''), 1500)
                  }}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">API Key</div>
              <Input
                value={gatewayForm.payaidApiKey}
                onChange={(e) => setGatewayForm((p) => ({ ...p, payaidApiKey: e.target.value }))}
                placeholder="Paste your API key"
                disabled={saveGateway.isPending || gatewayLoading}
                type={showSecrets ? 'text' : 'password'}
              />
              <div className="text-xs text-slate-500 dark:text-slate-400">Stored per-tenant. Masked once saved.</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">SALT (secret)</div>
              <Input
                value={gatewayForm.payaidSalt}
                onChange={(e) => setGatewayForm((p) => ({ ...p, payaidSalt: e.target.value }))}
                placeholder="Paste SALT"
                disabled={saveGateway.isPending || gatewayLoading}
                type={showSecrets ? 'text' : 'password'}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Base URL</div>
              <Input
                value={gatewayForm.payaidBaseUrl}
                onChange={(e) => setGatewayForm((p) => ({ ...p, payaidBaseUrl: e.target.value }))}
                placeholder="https://payments.payaid.in"
                disabled={saveGateway.isPending || gatewayLoading}
              />
              <div className="text-xs text-slate-500 dark:text-slate-400">Payment gateway API base URL.</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={gatewayForm.isActive}
                onChange={(e) => setGatewayForm((p) => ({ ...p, isActive: e.target.checked }))}
                disabled={saveGateway.isPending || gatewayLoading}
              />
              Enable gateway
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={gatewayForm.testMode}
                onChange={(e) => setGatewayForm((p) => ({ ...p, testMode: e.target.checked }))}
                disabled={saveGateway.isPending || gatewayLoading}
              />
              Test mode
            </label>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowSecrets((s) => !s)}>
              {showSecrets ? 'Hide secrets' : 'Edit secrets'}
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              onClick={() => saveGateway.mutate()}
              disabled={saveGateway.isPending || gatewayLoading || !diagnostics.canSave}
              title={!diagnostics.canSave ? 'Resolve Gateway diagnostics first' : undefined}
            >
              {saveGateway.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
