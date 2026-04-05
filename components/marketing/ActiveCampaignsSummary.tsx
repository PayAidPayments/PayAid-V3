'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Megaphone, Mail, MessageCircle, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type ActiveCampaignRow = {
  id: string
  name: string
  status: 'running' | 'paused' | 'sent'
  channels: string[]
  roiMultiplier: number
  lastActivityAt: string
}

function ChannelIcon({ label }: { label: string }) {
  const l = label.toLowerCase()
  if (l.includes('whatsapp')) return <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
  if (l.includes('email')) return <Mail className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden />
  if (l.includes('sms')) return <Smartphone className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" aria-hidden />
  return <Megaphone className="h-3.5 w-3.5 text-slate-500" aria-hidden />
}

function statusPill(status: ActiveCampaignRow['status']) {
  const cfg = {
    running: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    paused: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    sent: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }
  const label = status === 'running' ? 'Running' : status === 'paused' ? 'Paused' : 'Sent'
  return (
    <span className={cn('text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full', cfg[status])}>
      {label}
    </span>
  )
}

export function ActiveCampaignsSummary({
  tenantId,
  campaigns,
}: {
  tenantId: string
  campaigns: ActiveCampaignRow[]
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-5 py-4 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Active campaigns</h2>
        <Link
          href={`/marketing/${tenantId}/Campaigns`}
          className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
        >
          View all
        </Link>
      </div>
      {campaigns.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No campaigns yet.{' '}
          <Link href={`/marketing/${tenantId}/Campaigns/New`} className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
            Create your first campaign
          </Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/marketing/${tenantId}/Campaigns/${c.id}`}
                className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-transparent px-2 py-2 -mx-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-200/80 dark:hover:border-slate-700 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{c.name}</span>
                    {statusPill(c.status)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1" title={c.channels.join(', ')}>
                      {c.channels.map((ch) => (
                        <span key={ch} className="inline-flex" title={ch}>
                          <ChannelIcon label={ch} />
                        </span>
                      ))}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span title={c.lastActivityAt}>
                      {formatDistanceToNow(new Date(c.lastActivityAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                    {c.roiMultiplier > 0 ? `${c.roiMultiplier}x` : '—'}
                  </p>
                  <p className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Eng. ROI</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
