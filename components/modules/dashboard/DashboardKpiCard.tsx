'use client'

import Link from 'next/link'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { DashboardKpi, DashboardKpiTone } from './types'

const TONE_STYLES: Record<
  DashboardKpiTone,
  { accent: string; icon: string; ring: string }
> = {
  purple: {
    accent: 'border-l-[#53328A]',
    icon: 'text-[#53328A] dark:text-purple-300',
    ring: 'hover:ring-[#53328A]/30',
  },
  gold: {
    accent: 'border-l-[#F5C700]',
    icon: 'text-amber-600 dark:text-amber-300',
    ring: 'hover:ring-amber-400/30',
  },
  success: {
    accent: 'border-l-emerald-600',
    icon: 'text-emerald-600 dark:text-emerald-300',
    ring: 'hover:ring-emerald-400/30',
  },
  info: {
    accent: 'border-l-sky-600',
    icon: 'text-sky-600 dark:text-sky-300',
    ring: 'hover:ring-sky-400/30',
  },
  warning: {
    accent: 'border-l-amber-500',
    icon: 'text-amber-600 dark:text-amber-300',
    ring: 'hover:ring-amber-400/30',
  },
  error: {
    accent: 'border-l-red-600',
    icon: 'text-red-600 dark:text-red-300',
    ring: 'hover:ring-red-400/30',
  },
}

function Sparkline({ points }: { points: number[] }) {
  if (!points.length) return null
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const range = Math.max(max - min, 1)
  const w = 64
  const h = 24
  const d = points
    .map((p, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * w
      const y = h - ((p - min) / range) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function DashboardKpiCard({ kpi }: { kpi: DashboardKpi }) {
  const tone = kpi.tone || 'purple'
  const styles = TONE_STYLES[tone]

  if (kpi.empty) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40',
          'border-l-4 border-l-slate-300 dark:border-l-slate-600 p-4 min-h-[104px] flex flex-col justify-center'
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {kpi.label}
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {kpi.emptyLabel || 'No data yet'}
        </p>
      </div>
    )
  }

  const body = (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {kpi.label}
        </p>
        {kpi.icon ? <div className={cn('shrink-0', styles.icon)}>{kpi.icon}</div> : null}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50 truncate">
            {typeof kpi.value === 'number' ? kpi.value.toLocaleString('en-IN') : kpi.value}
          </p>
          {kpi.change !== undefined ? (
            <div
              className={cn(
                'mt-1 inline-flex items-center gap-1 text-xs font-medium',
                kpi.trend === 'down'
                  ? 'text-red-600 dark:text-red-400'
                  : kpi.trend === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500'
              )}
            >
              {kpi.trend === 'down' ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <TrendingUp className="w-3 h-3" />
              )}
              <span>{Math.abs(kpi.change)}%</span>
            </div>
          ) : null}
        </div>
        {kpi.sparkline?.length ? (
          <div className={styles.icon}>
            <Sparkline points={kpi.sparkline} />
          </div>
        ) : null}
      </div>
    </>
  )

  const className = cn(
    'rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950',
    'border-l-4 p-4 min-h-[104px] shadow-sm transition-shadow',
    styles.accent,
    (kpi.href || kpi.onClick) && cn('cursor-pointer hover:shadow-md ring-0 hover:ring-2', styles.ring)
  )

  if (kpi.href) {
    return (
      <Link href={kpi.href} className={cn(className, 'block')}>
        {body}
      </Link>
    )
  }

  return (
    <div className={className} onClick={kpi.onClick} role={kpi.onClick ? 'button' : undefined}>
      {body}
    </div>
  )
}

/** Renders exactly 4 KPI slots (pads with empty reserved cards). */
export function DashboardKpiRow({ kpis }: { kpis: DashboardKpi[] }) {
  const slots: DashboardKpi[] = [...kpis.slice(0, 4)]
  while (slots.length < 4) {
    slots.push({
      label: 'Reserved',
      value: '—',
      empty: true,
      emptyLabel: 'Coming soon',
    })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {slots.map((kpi, index) => (
        <DashboardKpiCard key={`${kpi.label}-${index}`} kpi={kpi} />
      ))}
    </div>
  )
}
