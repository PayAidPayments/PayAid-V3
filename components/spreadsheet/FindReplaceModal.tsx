'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FindReplaceModalProps {
  open: boolean
  onClose: () => void
  onFindAll: (find: string) => number
  onReplace: (find: string, replace: string) => void
  onReplaceAll: (find: string, replace: string) => number
}

export function FindReplaceModal({
  open,
  onClose,
  onFindAll,
  onReplace,
  onReplaceAll,
}: FindReplaceModalProps) {
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [count, setCount] = useState<number | null>(null)

  if (!open) return null

  const handleFind = () => {
    const c = onFindAll(find)
    setCount(c)
  }

  const handleReplace = () => {
    onReplace(find, replace)
    const c = onFindAll(find)
    setCount(c)
  }

  const handleReplaceAll = () => {
    const c = onReplaceAll(find, replace)
    setCount(c)
    setFind('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4" /> Find & Replace
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Find</label>
            <input
              type="text"
              value={find}
              onChange={(e) => setFind(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              placeholder="Text to find"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Replace with</label>
            <input
              type="text"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              placeholder="Replacement"
            />
          </div>
          {count !== null && <p className="text-xs text-slate-500">{count} occurrence(s)</p>}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={handleFind} className="rounded-lg">
            Find
          </Button>
          <Button size="sm" variant="outline" onClick={handleReplace} className="rounded-lg">
            Replace
          </Button>
          <Button size="sm" variant="outline" onClick={handleReplaceAll} className="rounded-lg">
            Replace all
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="rounded-lg">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
