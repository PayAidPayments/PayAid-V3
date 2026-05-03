'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

type DateFilter = 'week' | '7d' | '30d' | 'custom'
type ChannelFilter = 'all' | 'email' | 'sms' | 'whatsapp' | 'social'

const CHANNELS: { id: ChannelFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'whatsapp', label: 'WA' },
  { id: 'social', label: 'Social' },
]

/**
 * Marketing top bar: date range + channel chips (draft until Apply), Ask Marketing AI opens Page AI.
 * Applied values live in URL query (?mf=&m_ch=&m_from=&m_to=) so dashboards refetch only after Apply.
 */
export function MarketingShellControls() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const applied = useMemo(() => {
    const mf = (searchParams.get('mf') as DateFilter) || '30d'
    const ch = (searchParams.get('m_ch') as ChannelFilter) || 'all'
    return {
      mf: ['week', '7d', '30d', 'custom'].includes(mf) ? mf : '30d',
      ch: CHANNELS.some((c) => c.id === ch) ? ch : 'all',
      from: searchParams.get('m_from') || '',
      to: searchParams.get('m_to') || '',
    }
  }, [searchParams])

  const [draftMf, setDraftMf] = useState<DateFilter>(applied.mf)
  const [draftCh, setDraftCh] = useState<ChannelFilter>(applied.ch)
  const [draftFrom, setDraftFrom] = useState(applied.from)
  const [draftTo, setDraftTo] = useState(applied.to)

  const applyToUrl = useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString())
    sp.set('mf', draftMf)
    sp.set('m_ch', draftCh)
    if (draftMf === 'custom') {
      if (draftFrom) sp.set('m_from', draftFrom)
      else sp.delete('m_from')
      if (draftTo) sp.set('m_to', draftTo)
      else sp.delete('m_to')
    } else {
      sp.delete('m_from')
      sp.delete('m_to')
    }
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
  }, [draftCh, draftFrom, draftMf, draftTo, pathname, router, searchParams])

  const openMarketingAi = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('open-page-ai'))
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 w-full sm:w-auto sm:min-w-[3.25rem]">
            Period
          </span>
          <label className="inline-flex items-center gap-2">
            <span className="sr-only">Date range</span>
            <select
              value={draftMf}
              onChange={(e) => setDraftMf(e.target.value as DateFilter)}
              className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-800 dark:text-slate-200 min-w-[9.5rem]"
            >
              <option value="week">This week</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          {draftMf === 'custom' && (
            <span className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-sm"
                aria-label="From date"
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-sm"
                aria-label="To date"
              />
            </span>
          )}
        </div>
        <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-700 shrink-0" aria-hidden />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 shrink-0">
            Channels
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setDraftCh(c.id)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border border-transparent',
                  draftCh === c.id
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 lg:border-0 lg:pt-0">
        <Button type="button" size="sm" className="h-9 text-sm" onClick={applyToUrl}>
          Apply filters
        </Button>
        <button
          type="button"
          onClick={openMarketingAi}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300"
          title="Ask Marketing AI"
          aria-label="Ask Marketing AI"
        >
          <Bot className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
