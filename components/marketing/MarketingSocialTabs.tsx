'use client'

import { useState } from 'react'
import Link from 'next/link'

export type SocialPostRow = {
  id: string
  preview: string
  platform: string
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  accountName: string
}

export function MarketingSocialTabs({ tenantId, posts }: { tenantId: string; posts: SocialPostRow[] }) {
  const [view, setView] = useState<'calendar' | 'list'>('list')

  const start = new Date()
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              view === 'calendar' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-900 dark:text-violet-100' : ''
            }`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              view === 'list' ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-900 dark:text-violet-100' : ''
            }`}
          >
            List
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/marketing/${tenantId}/social/new`}
            className="rounded-xl bg-violet-600 text-white px-4 py-2 text-sm font-semibold hover:bg-violet-700"
          >
            New social post
          </Link>
          <Link
            href={`/marketing/${tenantId}/Social-Media`}
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:underline self-center"
          >
            Legacy social hub
          </Link>
        </div>
      </div>

      {view === 'calendar' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
          <p className="text-xs text-slate-500 mb-3">Week view (placeholder — full calendar later)</p>
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {weekDays.map((d) => (
              <div key={d.toISOString()} className="rounded-lg border border-slate-100 dark:border-slate-800 p-2 min-h-[72px]">
                <p className="font-semibold text-slate-700 dark:text-slate-200">{d.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                <p className="text-slate-500">{d.getDate()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
          {posts.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No scheduled posts. Connect accounts in{' '}
              <Link href={`/marketing/${tenantId}/channels`} className="text-violet-600 font-medium hover:underline">
                Channels
              </Link>
              .
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Preview</th>
                  <th className="px-4 py-2">Platform</th>
                  <th className="px-4 py-2">Account</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-2 max-w-[200px] truncate text-slate-800 dark:text-slate-100">{p.preview}</td>
                    <td className="px-4 py-2">{p.platform}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{p.accountName}</td>
                    <td className="px-4 py-2">{p.status}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {p.scheduledAt ? new Date(p.scheduledAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
