'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Folder,
  FolderOpen,
  FileText,
  Upload,
  FolderPlus,
  MoreVertical,
  Download,
  Trash2,
  ArrowLeft,
  File,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DriveFileItem {
  id: string
  name: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  fileType: string
  parentId: string | null
  createdAt: string
  createdBy?: { name: string | null } | null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DriveList({ tenantId }: { tenantId: string }) {
  const { token } = useAuthStore()
  const [files, setFiles] = useState<DriveFileItem[]>([])
  const [totalSize, setTotalSize] = useState(0)
  const [parentId, setParentId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([{ id: null, name: 'My Drive' }])
  const [loading, setLoading] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const loadFiles = async () => {
    if (!token) return
    setLoading(true)
    try {
      const url = parentId
        ? `/api/drive?parentId=${encodeURIComponent(parentId)}`
        : '/api/drive'
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files || [])
        setTotalSize(data.totalSize ?? 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [token, parentId])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const navigateTo = (id: string | null, name: string) => {
    setParentId(id)
    if (id === null) {
      setBreadcrumb([{ id: null, name: 'My Drive' }])
    } else {
      setBreadcrumb((prev) => [...prev, { id, name }])
    }
  }

  const handleBreadcrumb = (id: string | null) => {
    setParentId(id)
    if (id === null) {
      setBreadcrumb([{ id: null, name: 'My Drive' }])
    } else {
      const idx = breadcrumb.findIndex((b) => b.id === id)
      setBreadcrumb(breadcrumb.slice(0, idx + 1))
    }
  }

  const createFolder = async () => {
    if (!token || !newFolderName.trim()) return
    setCreatingFolder(true)
    try {
      const res = await fetch('/api/drive', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newFolderName.trim(), parentId }),
      })
      if (res.ok) {
        setNewFolderName('')
        loadFiles()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to create folder')
      }
    } catch (e) {
      alert('Failed to create folder')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    e.target.value = ''
    setUploading(true)
    try {
      const form = new FormData()
      form.set('file', file)
      if (parentId) form.set('parentId', parentId)
      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (res.ok) loadFiles()
      else alert('Upload failed')
    } catch (err) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (file: DriveFileItem) => {
    if (!token || file.fileType !== 'file') return
    try {
      const res = await fetch(`/api/drive/${file.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.fileName || file.name
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Download failed')
    }
  }

  const handleDelete = async (file: DriveFileItem) => {
    if (!confirm(`Delete "${file.name}"?${file.fileType === 'folder' ? ' Contents will be deleted.' : ''}`)) return
    if (!token) return
    setMenuOpenId(null)
    try {
      const res = await fetch(`/api/drive/${file.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) loadFiles()
      else alert('Delete failed')
    } catch (err) {
      alert('Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {breadcrumb.map((b, i) => (
            <span key={b.id ?? 'root'} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-400">/</span>}
              <button
                type="button"
                onClick={() => handleBreadcrumb(b.id)}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 truncate max-w-[120px]"
              >
                {b.name}
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {formatSize(totalSize)} used
          </span>
          <input
            ref={uploadInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => uploadInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
          <div className="flex gap-1">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="w-36 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
            />
            <Button size="sm" onClick={createFolder} disabled={creatingFolder || !newFolderName.trim()} className="gap-1">
              <FolderPlus className="h-4 w-4" />
              Folder
            </Button>
          </div>
        </div>
      </div>

      {parentId && (
        <button
          type="button"
          onClick={() => {
            const prev = breadcrumb[breadcrumb.length - 2]
            if (prev) handleBreadcrumb(prev.id)
          }}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      )}

      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <FolderOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">This folder is empty</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Upload files or create a folder</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => uploadInputRef.current?.click()} disabled={uploading}>
                  Upload
                </Button>
                <Button size="sm" variant="outline" onClick={createFolder} disabled={creatingFolder}>
                  New folder
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                >
                  {file.fileType === 'folder' ? (
                    <button
                      type="button"
                      onClick={() => navigateTo(file.id, file.name)}
                      className="flex flex-1 items-center gap-3 min-w-0 text-left"
                    >
                      <Folder className="h-5 w-5 text-amber-500 shrink-0" />
                      <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{file.name}</span>
                    </button>
                  ) : (
                    <>
                      <FileText className="h-5 w-5 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-slate-900 dark:text-slate-100 truncate block">{file.name}</span>
                        <span className="text-xs text-slate-500">{formatSize(file.fileSize)}</span>
                      </div>
                      <div ref={menuOpenId === file.id ? menuRef : undefined} className="relative flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <button
                          type="button"
                          onClick={() => setMenuOpenId(menuOpenId === file.id ? null : file.id)}
                          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpenId === file.id && (
                          <div className="absolute right-0 top-full mt-1 py-1 w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-10">
                            <button
                              type="button"
                              onClick={() => handleDownload(file)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(file)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {file.fileType === 'folder' && (
                    <div ref={menuOpenId === file.id ? menuRef : undefined} className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(menuOpenId === file.id ? null : file.id)}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuOpenId === file.id && (
                        <div className="absolute right-0 top-full mt-1 py-1 w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-10">
                          <button
                            type="button"
                            onClick={() => handleDelete(file)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
