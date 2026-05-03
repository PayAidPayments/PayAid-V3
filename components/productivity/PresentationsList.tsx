'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Presentation,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type SortOption = 'updated' | 'name'
type ViewMode = 'grid' | 'list'

interface PresItem {
  id: string
  name: string
  description?: string | null
  theme: string
  updatedAt: string
  createdAt: string
  createdBy?: { name: string | null } | null
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: new Date(d).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

export function PresentationsList({ tenantId }: { tenantId: string }) {
  const router = useRouter()
  const { token } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [presentations, setPresentations] = useState<PresItem[]>([])
  const [sort, setSort] = useState<SortOption>('updated')
  const [view, setView] = useState<ViewMode>('grid')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [isLoadingList, setIsLoadingList] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as Node
      if (menuOpenId && menuContainerRef.current && !menuContainerRef.current.contains(t)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpenId])

  useEffect(() => {
    if (token) loadPresentations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const loadPresentations = async () => {
    if (!token) return
    setIsLoadingList(true)
    try {
      const res = await fetch('/api/slides', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPresentations(data.presentations || [])
      }
    } catch (e) {
      console.error('Error loading presentations:', e)
    } finally {
      setIsLoadingList(false)
    }
  }

  const filtered = presentations.filter(
    (p) =>
      !searchQuery ||
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name')
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const createNew = () => {
    router.push(`/productivity/${tenantId}/slides/new`)
  }

  const openPres = (presId: string) => {
    if (renamingId) return
    router.push(`/productivity/${tenantId}/slides/${presId}`)
  }

  const handleDelete = async (e: React.MouseEvent, presId: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    if (!token) return
    try {
      const res = await fetch(`/api/slides/${presId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Delete failed')
      setMenuOpenId(null)
      await loadPresentations()
    } catch (err) {
      console.error(err)
      alert('Delete failed')
    }
  }

  const startRename = (e: React.MouseEvent, pres: PresItem) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpenId(null)
    setRenamingId(pres.id)
    setRenameValue(pres.name || '')
  }

  const submitRename = async () => {
    if (!renamingId || !token) return
    const value = renameValue.trim() || 'Untitled presentation'
    try {
      const res = await fetch(`/api/slides/${renamingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: value }),
      })
      if (!res.ok) throw new Error('Rename failed')
      setRenamingId(null)
      await loadPresentations()
    } catch (err) {
      console.error(err)
      alert('Rename failed')
    }
  }

  return (
    <div className="space-y-5">
      {/* Hero - similar to Spreadsheet Home */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-900/20 dark:to-orange-900/20 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Presentation className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              PayAid Slides
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Build and present slideshows. Present mode and export.
            </p>
          </div>
          <Button onClick={createNew} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            New presentation
          </Button>
        </div>
      </section>

      {isLoadingList && (
        <div className="h-1 w-full max-w-7xl mx-auto rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full w-1/3 bg-purple-500 dark:bg-purple-400 rounded-full"
            style={{ animation: 'loading 1.2s ease-in-out infinite' }}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {searchQuery ? 'Search results' : 'Your presentations'}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search presentations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setSort('updated')}
              className={`px-3 py-2 text-xs font-medium ${sort === 'updated' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
              Last updated
            </button>
            <button
              type="button"
              onClick={() => setSort('name')}
              className={`px-3 py-2 text-xs font-medium ${sort === 'name' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
              Name
            </button>
          </div>
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`p-2 ${view === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}
              title="Grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`p-2 ${view === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}
              title="List"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={createNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New presentation
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <Presentation className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {searchQuery ? 'No presentations match your search' : 'No presentations yet'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {searchQuery ? 'Try a different search term.' : 'Create your first presentation to get started.'}
            </p>
            {!searchQuery && (
              <Button onClick={createNew} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New presentation
              </Button>
            )}
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((pres) => (
            <Card
              key={pres.id}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all"
              onClick={() => openPres(pres.id)}
            >
              <CardContent className="p-4 flex flex-col h-28">
                <div className="flex items-start justify-between gap-2 flex-1 min-h-0">
                  <div className="flex-1 min-w-0">
                    {renamingId === pres.id ? (
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={submitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitRename()
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 border border-slate-200 dark:border-slate-700"
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {pres.name || 'Untitled presentation'}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(pres.updatedAt)}
                    </p>
                  </div>
                  <div
                    ref={menuOpenId === pres.id ? menuContainerRef : undefined}
                    className="relative opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(menuOpenId === pres.id ? null : pres.id)
                      }}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <MoreVertical className="h-4 w-4 text-slate-500" />
                    </button>
                    {menuOpenId === pres.id && (
                      <div className="absolute right-0 top-full mt-1 py-1 w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-10">
                        <button
                          type="button"
                          onClick={(e) => startRename(e, pres)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, pres.id, pres.name || 'Presentation')}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {sorted.map((pres) => (
            <div
              key={pres.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group"
              onClick={() => openPres(pres.id)}
            >
              <Presentation className="h-5 w-5 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                {renamingId === pres.id ? (
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={submitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitRename()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 border border-slate-200 dark:border-slate-700"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {pres.name || 'Untitled presentation'}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(pres.updatedAt)}
                  {pres.createdBy?.name ? ` · ${pres.createdBy.name}` : ''}
                </p>
              </div>
              <div
                ref={menuOpenId === pres.id ? menuContainerRef : undefined}
                className="relative opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpenId(menuOpenId === pres.id ? null : pres.id)
                  }}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <MoreVertical className="h-4 w-4 text-slate-500" />
                </button>
                {menuOpenId === pres.id && (
                  <div className="absolute right-0 top-full mt-1 py-1 w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-10">
                    <button
                      type="button"
                      onClick={(e) => startRename(e, pres)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, pres.id, pres.name || 'Presentation')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
