'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, FolderPlus, Search, Grid, List, MoreVertical, File, Folder, X } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'

export default function DrivePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [files, setFiles] = useState<any[]>([])
  const [totalSize, setTotalSize] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { token } = useAuthStore()

  useEffect(() => {
    if (token) {
      loadFiles()
    }
  }, [token])

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/drive', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
        setTotalSize(data.totalSize || 0)
      }
    } catch (error) {
      console.error('Error loading files:', error)
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/drive/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (response.ok) {
          setUploadProgress(((i + 1) / selectedFiles.length) * 100)
        }
      }
      await loadFiles()
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:')
    if (!folderName) return

    try {
      const response = await fetch('/api/drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: folderName }),
      })
      if (response.ok) {
        await loadFiles()
      }
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const storagePercentage = (totalSize / (50 * 1024 * 1024 * 1024)) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PayAid Drive</h1>
          <p className="text-gray-600 mt-1">Store, organize, and share your files - 50GB free storage</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateFolder}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FolderPlus className="h-5 w-5" />
            New Folder
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload className="h-5 w-5" />
            Upload
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Storage Used</span>
          <span className="text-sm text-gray-600">
            {formatFileSize(totalSize)} / 50 GB
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(storagePercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Uploading...</span>
            <span className="text-sm text-blue-700">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Files and Folders */}
      {files.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
          {files.map((file) => (
            <div
              key={file.id}
              className={viewMode === 'grid' 
                ? 'p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer'
                : 'flex items-center gap-4 p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors'
              }
            >
              {file.fileType === 'folder' ? (
                <Folder className="h-8 w-8 text-blue-600" />
              ) : (
                <File className="h-8 w-8 text-gray-600" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{file.name}</div>
                {viewMode === 'list' && (
                  <div className="text-sm text-gray-500">
                    {file.fileType === 'file' ? formatFileSize(file.fileSize) : 'Folder'} • {new Date(file.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12 border border-gray-200 rounded-lg">
          <p>No files yet. Upload your first file!</p>
        </div>
      )}
    </div>
  )
}

