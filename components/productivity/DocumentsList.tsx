'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Plus,
  FileEdit,
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

interface DocItem {
  id: string
  name: string
  description?: string | null
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

export function DocumentsList({ tenantId }: { tenantId: string }) {
  const router = useRouter()
  const { token } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [documents, setDocuments] = useState<DocItem[]>([])
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
    if (token) loadDocuments()
  }, [token])

  const loadDocuments = async () => {
    if (!token) return
    setIsLoadingList(true)
    try {
      const res = await fetch('/api/documents', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (e) {
      console.error('Error loading documents:', e)
    } finally {
      setIsLoadingList(false)
    }
  }

  const filtered = documents.filter(
    (d) =>
      !searchQuery ||
      (d.name && d.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name')
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const createNew = () => {
    router.push(`/productivity/${tenantId}/docs/new`)
  }

  const openDoc = (id: string) => {
    if (renamingId) return
    router.push(`/productivity/${tenantId}/docs/${id}`)
  }

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    if (!token) return
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Delete failed')
      setMenuOpenId(null)
      await loadDocuments()
    } catch (err) {
      console.error(err)
      alert('Delete failed')
    }
  }

  const startRename = (e: React.MouseEvent, doc: DocItem) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpenId(null)
    setRenamingId(doc.id)
    setRenameValue(doc.name || '')
  }

  const submitRename = async () => {
    if (!renamingId || !token) return
    const value = renameValue.trim() || 'Untitled document'
    try {
      const res = await fetch(`/api/documents/${renamingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: value }),
      })
      if (!res.ok) throw new Error('Rename failed')
      setRenamingId(null)
      await loadDocuments()
    } catch (err) {
      console.error(err)
      alert('Rename failed')
    }
  }

  return (
    <div className="space-y-5">
      {/* Hero - similar to Spreadsheet Home */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileEdit className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              PayAid Docs
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Create and edit documents with rich text, headings, and lists.
            </p>
          </div>
          <Button onClick={createNew} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            New document
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

      {/* Recent + toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {searchQuery ? 'Search results' : 'Your documents'}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
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
            New document
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <FileEdit className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {searchQuery ? 'No documents match your search' : 'No documents yet'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {searchQuery ? 'Try a different search term.' : 'Create your first document to get started.'}
            </p>
            {!searchQuery && (
              <Button onClick={createNew} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((doc) => (
            <Card
              key={doc.id}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all"
              onClick={() => openDoc(doc.id)}
            >
              <CardContent className="p-4 flex flex-col h-28">
                <div className="flex items-start justify-between gap-2 flex-1 min-h-0">
                  <div className="flex-1 min-w-0">
                    {renamingId === doc.id ? (
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
                        {doc.name || 'Untitled document'}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDate(doc.updatedAt)}
                    </p>
                  </div>
                  <div
                    ref={menuOpenId === doc.id ? menuContainerRef : undefined}
                    className="relative opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(menuOpenId === doc.id ? null : doc.id)
                      }}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <MoreVertical className="h-4 w-4 text-slate-500" />
                    </button>
                    {menuOpenId === doc.id && (
                      <div className="absolute right-0 top-full mt-1 py-1 w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-10">
                        <button
                          type="button"
                          onClick={(e) => startRename(e, doc)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, doc.id, doc.name || 'Document')}
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
          {sorted.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group"
              onClick={() => openDoc(doc.id)}
            >
              <FileEdit className="h-5 w-5 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                {renamingId === doc.id ? (
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
                    {doc.name || 'Untitled document'}
                  </p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(doc.updatedAt)}
                  {doc.createdBy?.name ? ` · ${doc.createdBy.name}` : ''}
                </p>
              </div>
              <div
                ref={menuOpenId === doc.id ? menuContainerRef : undefined}
                className="relative opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpenId(menuOpenId === doc.id ? null : doc.id)
                  }}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <MoreVertical className="h-4 w-4 text-slate-500" />
                </button>
                {menuOpenId === doc.id && (
                  <div className="absolute right-0 top-full mt-1 py-1 w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-10">
                    <button
                      type="button"
                      onClick={(e) => startRename(e, doc)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, doc.id, doc.name || 'Document')}
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
