'use client'

import Link from 'next/link'
import { LayoutGrid } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

/**
 * Lightweight module exit for Voice dev — avoids pulling full payaid-modules.config graph.
 */
export function VoiceModuleSwitcher() {
  const { tenant } = useAuthStore()
  const tenantKey = tenant?.slug || tenant?.id

  if (!tenantKey) {
    return null
  }

  return (
    <Link
      href={`/home/${tenantKey}`}
      className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      title="Open PayAid home (all modules)"
    >
      <LayoutGrid className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">All modules</span>
    </Link>
  )
}
