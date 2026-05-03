'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useAuthStore } from '@/lib/stores/auth'
import { getTenantRouteKey } from '@/lib/utils/tenant-route-key'

/**
 * Company-wide search in the top nav. Same component across all modules.
 * Opens a modal/panel; can be wired to command palette or search API later.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { tenant } = useAuthStore()

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    const q = encodeURIComponent(query.trim())
    const key = getTenantRouteKey(tenant)
    const target = key ? `/home/${key}?q=${q}` : `/home?q=${q}`
    router.push(target)
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400',
          'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
          'border border-slate-200/80 dark:border-slate-700'
        )}
        aria-label="Search"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm">
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-xl mx-4 overflow-hidden"
            role="dialog"
            aria-label="Global search"
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company data..."
                className="flex-1 bg-transparent border-0 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
            <p className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
              Search across contacts, deals, invoices, and more. Press Enter to go to results.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
