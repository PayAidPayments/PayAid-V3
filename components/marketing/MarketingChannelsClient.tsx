'use client'

import { useState } from 'react'

export type ChannelAccountRow = {
  id: string
  type: string
  provider: string
  status: string
}

const TYPES: { id: string; label: string; hint: string }[] = [
  { id: 'email', label: 'Email', hint: 'SMTP or OAuth (Gmail / Outlook) — stub.' },
  { id: 'sms', label: 'SMS', hint: 'MSG91, Twilio — API key & sender ID.' },
  { id: 'whatsapp', label: 'WhatsApp', hint: 'WAHA: QR pair & status badge (TODO).' },
  { id: 'facebook_instagram', label: 'Facebook & Instagram', hint: 'Meta Business — pages / IG business IDs.' },
  { id: 'linkedin', label: 'LinkedIn', hint: 'Organization / page OAuth.' },
  { id: 'youtube', label: 'YouTube', hint: 'Channel OAuth & upload defaults.' },
]

export function MarketingChannelsClient({
  tenantId,
  accounts,
}: {
  tenantId: string
  accounts: ChannelAccountRow[]
}) {
  const [selected, setSelected] = useState(TYPES[0].id)

  const row = accounts.find((a) => a.type === selected)
  const meta = TYPES.find((t) => t.id === selected)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
      <nav className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 space-y-0.5">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelected(t.id)}
            className={`w-full text-left rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              selected === t.id
                ? 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-100'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{meta?.label}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{meta?.hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase text-slate-500">Status</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              row?.status === 'connected'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {row?.status ?? 'Not connected'}
          </span>
          {row?.provider ? (
            <span className="text-xs text-slate-500">Provider: {row.provider}</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => alert(`Connect ${meta?.label} — OAuth / forms wired later. Tenant: ${tenantId}`)}
          className="rounded-xl bg-violet-600 text-white px-4 py-2 text-sm font-semibold hover:bg-violet-700"
        >
          Connect {meta?.label}
        </button>
        <p className="text-xs text-slate-400">Tenant: {tenantId}</p>
      </div>
    </div>
  )
}
