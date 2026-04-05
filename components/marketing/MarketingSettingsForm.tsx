'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'

type SettingsRow = {
  monthlyBudgetInr: number | null
  waMonthlyBudgetInr: number | null
  emailMonthlyBudgetInr: number | null
  smsMonthlyBudgetInr: number | null
  dailyContactCap: number | null
  weeklyContactCap: number | null
  quietHoursStart: number | null
  quietHoursEnd: number | null
} | null

const empty = {
  monthlyBudgetInr: '' as string | number,
  waMonthlyBudgetInr: '' as string | number,
  emailMonthlyBudgetInr: '' as string | number,
  smsMonthlyBudgetInr: '' as string | number,
  dailyContactCap: '' as string | number,
  weeklyContactCap: '' as string | number,
  quietHoursStart: '' as string | number,
  quietHoursEnd: '' as string | number,
}

function num(v: string | number): number | null {
  if (v === '' || v === undefined) return null
  const n = typeof v === 'string' ? parseInt(v, 10) : v
  return Number.isFinite(n) ? n : null
}

export function MarketingSettingsForm() {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    fetch('/api/marketing/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: { settings: SettingsRow }) => {
        const s = data.settings
        if (!s) {
          setForm(empty)
          return
        }
        setForm({
          monthlyBudgetInr: s.monthlyBudgetInr ?? '',
          waMonthlyBudgetInr: s.waMonthlyBudgetInr ?? '',
          emailMonthlyBudgetInr: s.emailMonthlyBudgetInr ?? '',
          smsMonthlyBudgetInr: s.smsMonthlyBudgetInr ?? '',
          dailyContactCap: s.dailyContactCap ?? '',
          weeklyContactCap: s.weeklyContactCap ?? '',
          quietHoursStart: s.quietHoursStart ?? '',
          quietHoursEnd: s.quietHoursEnd ?? '',
        })
      })
      .catch(() => setMessage('Could not load settings'))
      .finally(() => setLoading(false))
  }, [token])

  const save = () => {
    if (!token) return
    setSaving(true)
    setMessage(null)
    fetch('/api/marketing/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        monthlyBudgetInr: num(form.monthlyBudgetInr),
        waMonthlyBudgetInr: num(form.waMonthlyBudgetInr),
        emailMonthlyBudgetInr: num(form.emailMonthlyBudgetInr),
        smsMonthlyBudgetInr: num(form.smsMonthlyBudgetInr),
        dailyContactCap: num(form.dailyContactCap),
        weeklyContactCap: num(form.weeklyContactCap),
        quietHoursStart: num(form.quietHoursStart),
        quietHoursEnd: num(form.quietHoursEnd),
      }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}))
          throw new Error(j.error || 'Save failed')
        }
        setMessage('Saved.')
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : 'Save failed'))
      .finally(() => setSaving(false))
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading settings…</p>
  }

  const field = (label: string, key: keyof typeof form, hint?: string) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <input
        type="number"
        min={0}
        value={form[key] === '' ? '' : form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full max-w-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
        placeholder="Optional"
      />
      {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  )

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Budgets & send guardrails</h2>
      <p className="text-xs text-slate-500">
        Estimates use ChannelEvent volume (stub ₹/send). Hard caps block sends when set on a campaign and budget is exceeded.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('Overall monthly budget (₹)', 'monthlyBudgetInr')}
        {field('WhatsApp monthly cap (₹)', 'waMonthlyBudgetInr')}
        {field('Email monthly cap (₹)', 'emailMonthlyBudgetInr')}
        {field('SMS monthly cap (₹)', 'smsMonthlyBudgetInr')}
        {field('Max messages / contact / day', 'dailyContactCap', 'Enforcement in workers — TODO')}
        {field('Max messages / contact / week', 'weeklyContactCap')}
        {field('Quiet hours start (0–23)', 'quietHoursStart', 'No sends during this window (local server time for now)')}
        {field('Quiet hours end (0–23)', 'quietHoursEnd')}
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={saving || !token}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        {message && <span className="text-sm text-slate-600 dark:text-slate-300">{message}</span>}
      </div>
    </div>
  )
}
