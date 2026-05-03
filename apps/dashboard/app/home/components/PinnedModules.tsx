'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppIcon } from '@/components/home/AppIcon'
import { getDashboardUrl } from '@/lib/utils/dashboard-url'
import { getModuleHomeUrl, getModuleById } from '@/lib/config/payaid-modules.config'
import { Button } from '@/components/ui/button'
import { ChevronRight, X, GripVertical } from 'lucide-react'

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

function getModuleLabel(moduleId: string): string {
  return getModuleById(moduleId)?.label ?? moduleId
}

function getModuleHref(moduleId: string, tenantId: string): string {
  if (moduleId === 'marketplace') return getDashboardUrl('/marketplace')
  return getModuleHomeUrl(moduleId, tenantId)
}

const STORAGE_KEY = 'home-pinned-modules'
const MAX_PINNED = 8

function loadPinnedFromStorage(): string[] {
  if (typeof window === 'undefined') return [...DEFAULT_PINNED_ORDER]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, MAX_PINNED)
    }
  } catch (_) {}
  return [...DEFAULT_PINNED_ORDER]
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

  const [pinnedIds, setPinnedIds] = useState<string[]>([])

  useEffect(() => {
    const initId = globalThis.setTimeout(() => {
      setPinnedIds(loadPinnedFromStorage())
    }, 0)
    const onPinnedChange = () => setPinnedIds(loadPinnedFromStorage())
    window.addEventListener('home-pinned-modules-changed', onPinnedChange)
    return () => {
      globalThis.clearTimeout(initId)
      window.removeEventListener('home-pinned-modules-changed', onPinnedChange)
    }
  }, [])

  const removeFromPinned = useCallback((moduleId: string) => {
    setPinnedIds((prev) => {
      const next = prev.filter((id) => id !== moduleId)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (_) {}
      return next
    })
  }, [])

  const [isReorderMode, setIsReorderMode] = useState(false)

  const handleDragStart = useCallback((e: React.DragEvent, moduleId: string) => {
    if (!isReorderMode) return
    e.dataTransfer.setData('text/plain', moduleId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-pinned-module-id', moduleId)
    ;(e.target as HTMLElement).classList.add('opacity-60')
  }, [isReorderMode])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    ;(e.target as HTMLElement).classList.remove('opacity-60')
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isReorderMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [isReorderMode])

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    if (!isReorderMode) return
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('application/x-pinned-module-id') || e.dataTransfer.getData('text/plain')
    if (!draggedId) return
    setPinnedIds((prev) => {
      const set = new Set(availableModuleIds ?? prev)
      const visible = prev.filter((id) => set.has(id)).slice(0, MAX_PINNED)
      const fromIndex = visible.indexOf(draggedId)
      if (fromIndex === -1 || fromIndex === dropIndex) return prev
      const reordered = [...visible]
      const [removed] = reordered.splice(fromIndex, 1)
      reordered.splice(dropIndex, 0, removed)
      const rest = prev.filter((id) => !reordered.includes(id))
      const next = [...reordered, ...rest]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (_) {}
      return next
    })
  }, [isReorderMode, availableModuleIds])

  const toShow = useMemo(() => {
    const set = new Set(availableModuleIds ?? pinnedIds)
    return pinnedIds.filter((id) => set.has(id)).slice(0, MAX_PINNED)
  }, [pinnedIds, availableModuleIds])

  if (toShow.length === 0) return null

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
          Pinned &amp; Recent
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 -mr-2"
          onClick={() => setIsReorderMode((v) => !v)}
        >
          {isReorderMode ? 'Done' : 'Organise'}
        </Button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 scrollbar-thin">
        {toShow.map((moduleId, index) => (
          <div
            key={moduleId}
            draggable={isReorderMode}
            onDragStart={(e) => handleDragStart(e, moduleId)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`flex-shrink-0 w-[180px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex flex-col relative group transition-all duration-150 ${
              isReorderMode
                ? 'cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-600'
                : 'hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            {isReorderMode && (
              <div
                className="absolute bottom-2 right-2 z-10 flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-grab active:cursor-grabbing"
                aria-hidden
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                onClick={(e) => {
                  e.preventDefault()
                  removeFromPinned(moduleId)
                }}
                aria-label={`Remove ${getModuleLabel(moduleId)} from Pinned & Recent`}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Link
              href={isReorderMode ? '#' : getModuleHref(moduleId, tid)}
              onClick={(e) => isReorderMode && e.preventDefault()}
              className="flex flex-col min-w-0 flex-1 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              <div className="flex items-start justify-between mb-3">
                <AppIcon moduleId={moduleId} size="lg" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-1">
                {getModuleLabel(moduleId)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">
                {moduleSummaries[moduleId] ?? 'Open'}
              </p>
              <span className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400">
                Open
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
