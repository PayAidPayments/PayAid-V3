'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Plus,
  FileSpreadsheet,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Download,
  Copy,
  Trash2,
  Edit3,
  Upload,
  FileUp,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import * as XLSX from 'xlsx'

type SortOption = 'updated' | 'name'
type ViewMode = 'grid' | 'list'

interface SheetItem {
  id: string
  name: string
  description?: string | null
  updatedAt: Date
  createdAt: Date
  createdBy?: { name: string | null } | null
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: new Date(d).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

/** Parse CSV text into 2D array (simple: handle quoted fields) */
function parseCsv(text: string): string[][] {
  const lines: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else inQuotes = false
      } else cell += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',' || c === '\t') {
        row.push(cell)
        cell = ''
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++
        row.push(cell)
        cell = ''
        if (row.some((v) => v.trim() !== '')) lines.push(row)
        row = []
      } else cell += c
    }
  }
  row.push(cell)
  if (row.some((v) => v.trim() !== '')) lines.push(row)
  return lines
}

/** Parse XLSX/XLS file (ArrayBuffer) into 2D string array (first sheet) */
function parseXlsx(arrayBuffer: ArrayBuffer): string[][] {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
  const firstSheetName = wb.SheetNames[0]
  if (!firstSheetName) return [[]]
  const ws = wb.Sheets[firstSheetName]
  const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })
  return raw.map((row) => (Array.isArray(row) ? row.map((c) => (c != null ? String(c) : '')) : []))
}

export default function SpreadsheetsListPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = (params?.tenantId as string) || ''
  const [searchQuery, setSearchQuery] = useState('')
  const [spreadsheets, setSpreadsheets] = useState<SheetItem[]>([])
  const [sort, setSort] = useState<SortOption>('updated')
  const [view, setView] = useState<ViewMode>('grid')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState<'parsing' | 'uploading'>('parsing')
  const [isLoadingList, setIsLoadingList] = useState(false)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const menuContainerRef = useRef<HTMLDivElement | null>(null)
  const { token } = useAuthStore()

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
    setMenuOpenId(null)
  }, [view])

  useEffect(() => {
    if (token) loadSpreadsheets()
  }, [token])

  const loadSpreadsheets = async () => {
    if (!token) return
    setIsLoadingList(true)
    try {
      const res = await fetch('/api/spreadsheets', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSpreadsheets(data.spreadsheets || [])
      }
    } catch (e) {
      console.error('Error loading spreadsheets:', e)
    } finally {
      setIsLoadingList(false)
    }
  }

  const filtered = spreadsheets.filter(
    (s) =>
      !searchQuery ||
      (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name')
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const createNew = () => {
    router.push(`/spreadsheet/${tenantId}/Spreadsheets/create`)
  }

  const openSheet = (id: string) => {
    if (renamingId) return
    router.push(`/spreadsheet/${tenantId}/Spreadsheets/${id}`)
  }

  type ExportFormat = 'csv' | 'xlsx' | 'xls'
  const safeName = (n: string) => (n || 'spreadsheet').replace(/[^a-zA-Z0-9-_]/g, '_')

  const handleDownload = async (
    e: React.MouseEvent,
    id: string,
    name: string,
    format: ExportFormat
  ) => {
    e.preventDefault()
    e.stopPropagation()
    if (!token) return
    const ext = format === 'xls' ? 'xls' : format
    try {
      const res = await fetch(`/api/spreadsheets/${id}/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${safeName(name)}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Download failed')
    }
  }

  const handleDuplicate = async (e: React.MouseEvent, sheet: SheetItem) => {
    e.preventDefault()
    e.stopPropagation()
    if (!token) return
    try {
      const getRes = await fetch(`/api/spreadsheets/${sheet.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!getRes.ok) throw new Error('Failed to load spreadsheet')
      const full = await getRes.json()
      const postRes = await fetch('/api/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${full.name || 'Copy'} (Copy)`,
          description: full.description,
          data: full.data,
        }),
      })
      if (!postRes.ok) throw new Error('Failed to duplicate')
      const created = await postRes.json()
      await loadSpreadsheets()
      router.push(`/spreadsheet/${tenantId}/Spreadsheets/${created.id}`)
    } catch (err) {
      console.error(err)
      alert('Duplicate failed')
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    if (!token) return
    try {
      const res = await fetch(`/api/spreadsheets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Delete failed')
      await loadSpreadsheets()
    } catch (err) {
      console.error(err)
      alert('Delete failed')
    }
  }

  const startRename = (e: React.MouseEvent, sheet: SheetItem) => {
    e.preventDefault()
    e.stopPropagation()
    setRenamingId(sheet.id)
    setRenameValue(sheet.name || '')
  }

  const submitRename = async () => {
    if (!renamingId || !token) return
    const value = renameValue.trim() || 'Untitled'
    try {
      const res = await fetch(`/api/spreadsheets/${renamingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: value }),
      })
      if (!res.ok) throw new Error('Rename failed')
      setRenamingId(null)
      await loadSpreadsheets()
    } catch (err) {
      console.error(err)
      alert('Rename failed')
    }
  }

  const ACCEPT_EXT = ['csv', 'xlsx', 'xls'] as const
  const acceptTypes = '.csv,.xlsx,.xls'

  const createSpreadsheetFromData = useCallback(
    async (name: string, data: string[][]) => {
      if (!token) return
      setUploadPhase('uploading')
      setUploadProgress(0)
      const body = JSON.stringify({ name: name || 'Imported', data })
      const created = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const url = '/api/spreadsheets'
        xhr.open('POST', url)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((100 * e.loaded) / e.total))
          } else {
            setUploadProgress((p) => Math.min(p + 10, 90))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch {
              reject(new Error('Invalid response'))
            }
          } else {
            reject(new Error(xhr.statusText || 'Upload failed'))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(body)
      })
      setUploadProgress(100)
      await loadSpreadsheets()
      router.push(`/spreadsheet/${tenantId}/Spreadsheets/${created.id}`)
    },
    [token, tenantId, router]
  )

  const processFile = useCallback(
    async (file: File): Promise<{ name: string; data: string[][] }> => {
      const ext = (file.name.split('.').pop() || '').toLowerCase()
      if (!ACCEPT_EXT.includes(ext as typeof ACCEPT_EXT[number])) {
        throw new Error('Please use a .csv, .xlsx, or .xls file.')
      }
      const baseName = file.name.replace(/\.(csv|xlsx|xls)$/i, '') || 'Imported'
      if (ext === 'csv') {
        const text = await file.text()
        const data = parseCsv(text)
        return { name: baseName, data }
      }
      const ab = await file.arrayBuffer()
      const data = parseXlsx(ab)
      return { name: baseName, data }
    },
    []
  )

  const handleUploadClick = () => uploadInputRef.current?.click()

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    e.target.value = ''
    setIsUploading(true)
    setUploadPhase('parsing')
    setUploadProgress(0)
    try {
      const { name, data } = await processFile(file)
      await createSpreadsheetFromData(name, data)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const files = e.dataTransfer.files
      if (!files?.length || !token) return
      const file = Array.from(files).find((f) => {
        const ext = (f.name.split('.').pop() || '').toLowerCase()
        return ACCEPT_EXT.includes(ext as typeof ACCEPT_EXT[number])
      })
      if (!file) {
        alert('Please drop a .csv, .xlsx, or .xls file.')
        return
      }
      setIsUploading(true)
      setUploadPhase('parsing')
      setUploadProgress(0)
      try {
        const { name, data } = await processFile(file)
        await createSpreadsheetFromData(name, data)
      } catch (err) {
        console.error(err)
        alert(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [token, processFile, createSpreadsheetFromData]
  )

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Loading list progress (indeterminate) */}
      {isLoadingList && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full w-1/3 bg-purple-500 dark:bg-purple-400" style={{ animation: 'loading 1.2s ease-in-out infinite' }} />
        </div>
      )}

      {/* Upload progress (determinate when uploading, indeterminate when parsing) */}
      {isUploading && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
              {uploadPhase === 'parsing' ? 'Preparing file…' : `Uploading… ${uploadProgress}%`}
            </span>
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              {uploadPhase === 'parsing' ? (
                <div className="h-full w-1/3 bg-purple-500 dark:bg-purple-400 rounded-full" style={{ animation: 'loading 1.2s ease-in-out infinite' }} />
              ) : (
                <div
                  className="h-full bg-purple-500 dark:bg-purple-400 rounded-full transition-[width] duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {isDragging && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-purple-500/20 dark:bg-purple-600/30 backdrop-blur-sm border-2 border-dashed border-purple-500 dark:border-purple-400 rounded-none"
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 px-8 py-6 flex flex-col items-center gap-3">
            <FileUp className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            <p className="text-lg font-medium text-slate-800 dark:text-slate-100">Drop file to upload</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">.csv, .xlsx, or .xls</p>
          </div>
        </div>
      )}

      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 md:px-8 pt-6 pb-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Spreadsheets</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Create and manage spreadsheets with formulas, charts, and collaboration.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search spreadsheets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-1.5" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1.5" />
                  Upload
                </>
              )}
            </Button>
            <input
              ref={uploadInputRef}
              type="file"
              accept={acceptTypes}
              className="hidden"
              onChange={handleUploadFile}
            />
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
              onClick={createNew}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Spreadsheet
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-8 py-6 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300"
            >
              <option value="updated">Recently updated</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`p-1.5 rounded ${view === 'grid' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`p-1.5 rounded ${view === 'list' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              onClick={() => !isUploading && uploadInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-2xl transition-colors cursor-pointer ${
                isDragging
                  ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-slate-300 dark:border-slate-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400'
              } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <FileUp className="h-10 w-10 mb-2" />
              <span className="text-sm font-medium text-center px-2">Drop .csv or .xlsx here</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">or click to browse</span>
            </div>
            <button
              type="button"
              onClick={createNew}
              className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <Plus className="h-10 w-10 mb-2" />
              <span className="text-sm font-medium">New Spreadsheet</span>
            </button>
            {sorted.map((sheet) => (
              <div
                key={sheet.id}
                onClick={() => openSheet(sheet.id)}
                className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all p-4 flex flex-col justify-between min-h-[120px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                    {renamingId === sheet.id ? (
                      <input
                        className="flex-1 min-w-0 text-sm font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 outline-none"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={submitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitRename()
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm font-medium truncate max-w-[180px]">{sheet.name}</p>
                    )}
                  </div>
                  <div
                    ref={menuOpenId === sheet.id ? menuContainerRef : undefined}
                    className="relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setMenuOpenId(menuOpenId === sheet.id ? null : sheet.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpenId === sheet.id && (
                      <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1">
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2" onClick={() => { setRenamingId(sheet.id); setRenameValue(sheet.name || ''); setMenuOpenId(null); }}>
                          <Edit3 className="h-4 w-4" /> Rename
                        </button>
<button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2" onClick={(e) => { handleDownload(e, sheet.id, sheet.name, 'csv'); setMenuOpenId(null); }}>
                              <Download className="h-4 w-4" /> Save as CSV
                            </button>
                            <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2" onClick={(e) => { handleDownload(e, sheet.id, sheet.name, 'xlsx'); setMenuOpenId(null); }}>
                              <Download className="h-4 w-4" /> Save as Excel (.xlsx)
                            </button>
                            <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2" onClick={(e) => { handleDownload(e, sheet.id, sheet.name, 'xls'); setMenuOpenId(null); }}>
                              <Download className="h-4 w-4" /> Save as Excel 97-2003 (.xls)
                            </button>
                            <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2" onClick={(e) => { handleDuplicate(e, sheet); setMenuOpenId(null); }}>
                          <Copy className="h-4 w-4" /> Duplicate
                        </button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-red-600 dark:text-red-400" onClick={(e) => { handleDelete(e, sheet.id, sheet.name); setMenuOpenId(null); }}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                  Updated {formatDate(sheet.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div
              onClick={() => !isUploading && uploadInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed py-3 px-4 text-center text-sm transition-colors cursor-pointer ${
                isDragging
                  ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400'
              } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <FileUp className="h-4 w-4 inline-block mr-1.5 align-middle" />
              Drop .csv or .xlsx here, or click to upload
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">Updated</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((sheet) => (
                  <tr
                    key={sheet.id}
                    onClick={() => openSheet(sheet.id)}
                    className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        {renamingId === sheet.id ? (
                          <input
                            className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-800 border rounded px-2 py-0.5 text-sm outline-none"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={submitRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitRename()
                              if (e.key === 'Escape') setRenamingId(null)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium truncate max-w-[240px]">{sheet.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{formatDate(sheet.updatedAt)}</td>
                    <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                      <div
                        ref={menuOpenId === sheet.id ? menuContainerRef : undefined}
                        className="relative inline-block"
                      >
                        <button
                          type="button"
                          onClick={() => setMenuOpenId(menuOpenId === sheet.id ? null : sheet.id)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpenId === sheet.id && (
                          <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1">
                            <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2" onClick={() => { setRenamingId(sheet.id); setRenameValue(sheet.name || ''); setMenuOpenId(null); }}>
                              <Edit3 className="h-4 w-4" /> Rename
                            </button>
                            <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2" onClick={(e) => { handleDownload(e, sheet.id, sheet.name, 'csv'); setMenuOpenId(null); }}>
                              <Download className="h-4 w-4" /> Save as CSV
                            </button>
                            <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2" onClick={(e) => { handleDownload(e, sheet.id, sheet.name, 'xlsx'); setMenuOpenId(null); }}>
                              <Download className="h-4 w-4" /> Save as Excel (.xlsx)
                            </button>
                            <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2" onClick={(e) => { handleDownload(e, sheet.id, sheet.name, 'xls'); setMenuOpenId(null); }}>
                              <Download className="h-4 w-4" /> Save as Excel 97-2003 (.xls)
                            </button>
                            <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2" onClick={(e) => { handleDuplicate(e, sheet); setMenuOpenId(null); }}>
                              <Copy className="h-4 w-4" /> Duplicate
                            </button>
                            <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-red-600 dark:text-red-400" onClick={(e) => { handleDelete(e, sheet.id, sheet.name); setMenuOpenId(null); }}>
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
            <FileSpreadsheet className="h-14 w-14 mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-sm">
              {searchQuery ? 'No spreadsheets match your search.' : 'No spreadsheets yet. Create your first one!'}
            </p>
            {!searchQuery && (
              <Button className="mt-4 rounded-xl" size="sm" onClick={createNew}>
                <Plus className="h-4 w-4 mr-2" /> New Spreadsheet
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
