'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppIcon } from '@/components/home/AppIcon'
import { getDashboardUrl } from '@/lib/utils/dashboard-url'
import { getModuleHomeUrl } from '@/lib/config/payaid-modules.config'
import { ChevronRight } from 'lucide-react'

const DEFAULT_PINNED_ORDER = [
  'crm',
  'finance',
  'hr',
  'marketing',
  'sales',
  'projects',
  'inventory',
  'ai-studio',
] as const

const MODULE_LABELS: Record<string, string> = {
  crm: 'CRM',
  finance: 'Finance',
  hr: 'HR',
  marketing: 'Marketing',
  sales: 'Sales Pages',
  projects: 'Projects',
  inventory: 'Inventory',
  'ai-studio': 'AI Studio',
  analytics: 'Analytics',
  productivity: 'Productivity',
}

function getModuleHref(moduleId: string, tenantId: string): string {
  if (moduleId === 'marketplace') return getDashboardUrl('/marketplace')
  return getModuleHomeUrl(moduleId, tenantId)
}

interface PinnedModulesProps {
  moduleSummaries?: Record<string, string>
  availableModuleIds?: string[]
  tenantId: string
}

export function PinnedModules({
  moduleSummaries = {},
  availableModuleIds,
  tenantId,
}: PinnedModulesProps) {
  const params = useParams()
  const tid = (params?.tenantId as string) || tenantId

  const pinnedIds = useMemo(() => {
    if (typeof window === 'undefined') return DEFAULT_PINNED_ORDER.slice(0, 8)
    try {
      const raw = localStorage.getItem('home-pinned-modules')
      if (raw) {
        const parsed = JSON.parse(raw) as string[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 8)
      }
    } catch (_) {}
    return [...DEFAULT_PINNED_ORDER]
  }, [])

  const toShow = useMemo(() => {
    const set = new Set(availableModuleIds ?? pinnedIds)
    return pinnedIds.filter((id) => set.has(id)).slice(0, 8)
  }, [pinnedIds, availableModuleIds])

  if (toShow.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-4">
        Pinned &amp; Recent
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 scrollbar-thin">
        {toShow.map((moduleId) => (
          <Link
            key={moduleId}
            href={getModuleHref(moduleId, tid)}
            className="flex-shrink-0 w-[180px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <AppIcon moduleId={moduleId} size="lg" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-1">
              {MODULE_LABELS[moduleId] ?? moduleId}
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">
              {moduleSummaries[moduleId] ?? 'Open'}
            </p>
            <span className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
              Open
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
