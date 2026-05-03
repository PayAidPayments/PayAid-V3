'use client'

import { useState } from 'react'
import Link from 'next/link'

export type ContentItemRow = {
  id: string
  title: string
  type: string
  channels: string[]
  goal: string | null
  updatedAt: string
}

export type MediaAssetRow = {
  id: string
  url: string
  type: string
  tags: string[]
  createdAt: string
}

const STATIC_TEMPLATES = [
  { name: 'Welcome email series', channels: ['email'] as string[] },
  { name: 'Abandoned cart — WhatsApp', channels: ['whatsapp'] as string[] },
  { name: 'Festival broadcast', channels: ['email', 'sms', 'whatsapp'] },
]

export function MarketingLibraryTabs({
  tenantId,
  contentItems,
  mediaAssets,
}: {
  tenantId: string
  contentItems: ContentItemRow[]
  mediaAssets: MediaAssetRow[]
}) {
  const [tab, setTab] = useState<'content' | 'media' | 'templates'>('content')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(['content', 'media', 'templates'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg capitalize ${
              tab === t
                ? 'bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'content' && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
          {contentItems.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No content yet.{' '}
              <Link href={`/marketing/${tenantId}/studio`} className="text-violet-600 font-medium hover:underline">
                Open Studio
              </Link>{' '}
              and save a draft.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Channels</th>
                  <th className="px-4 py-2">Goal</th>
                  <th className="px-4 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {contentItems.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-50">{c.title}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{c.type}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{c.channels.join(', ') || '—'}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{c.goal ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{new Date(c.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-slate-400 px-4 py-2 border-t border-slate-100 dark:border-slate-800">
            TODO: pagination (showing up to 20)
          </p>
        </div>
      )}

      {tab === 'media' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {mediaAssets.length === 0 ? (
            <p className="col-span-full text-sm text-slate-500 p-4">No media assets yet.</p>
          ) : (
            mediaAssets.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 text-xs space-y-2 bg-white dark:bg-slate-900"
              >
                <div className="aspect-video rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  {m.type === 'image' ? 'IMG' : m.type.toUpperCase()}
                </div>
                <p className="font-medium truncate text-slate-800 dark:text-slate-100">{m.url.slice(-24)}</p>
                <p className="text-slate-500">{m.tags.slice(0, 3).join(', ') || '—'}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'templates' && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STATIC_TEMPLATES.map((tpl) => (
            <li
              key={tpl.name}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-slate-900"
            >
              <p className="font-semibold text-slate-900 dark:text-slate-50">{tpl.name}</p>
              <p className="text-xs text-slate-500 mt-1">{tpl.channels.join(' · ')}</p>
              <button
                type="button"
                className="mt-3 text-sm text-violet-600 font-medium hover:underline"
                onClick={() => alert('Template install — TODO')}
              >
                Use template (stub)
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
