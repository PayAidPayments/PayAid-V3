'use client'

import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

const DOCS_TABS = [
  { name: 'Home', slug: 'Home' },
  { name: 'Documents', slug: 'Documents' },
  { name: 'Templates', slug: 'Templates' },
] as const

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const tenantId = (params?.tenantId as string) ?? ''
  const base = `/productivity/${tenantId}/docs`

  const isActive = (slug: string) => {
    if (slug === 'Home') return pathname === `${base}/Home` || pathname === `${base}` || pathname === `${base}/`
    if (slug === 'Documents') return pathname === `${base}/Documents` || (pathname?.startsWith(`${base}/Documents`) && pathname !== `${base}/Documents/new`)
    if (slug === 'Templates') return pathname === `${base}/Templates`
    return false
  }

  // Hide sub-nav when editing a document (editor has its own ribbon)
  const segment = pathname?.replace(base, '').replace(/^\//, '')?.split('/')[0] ?? ''
  const isEditor = pathname?.startsWith(base + '/') && segment !== '' && !['Home', 'Documents', 'Templates'].includes(segment)

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Docs sub-header (like Sheets: Home | Spreadsheets | Templates) - hidden in editor */}
      {!isEditor && (
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-2 py-1.5 -mx-2 mb-4 rounded-b-lg">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-2 hidden sm:inline">
          PayAid Docs
        </span>
        {DOCS_TABS.map((tab) => (
          <Link
            key={tab.slug}
            href={tab.slug === 'Home' ? `${base}/Home` : `${base}/${tab.slug}`}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
              isActive(tab.slug)
                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            {tab.name}
          </Link>
        ))}
      </div>
      )}
      {children}
    </div>
  )
}
