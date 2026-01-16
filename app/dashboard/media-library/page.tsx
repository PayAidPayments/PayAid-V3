'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Upload, 
  Search, 
  Filter, 
  Grid3x3, 
  List, 
  Trash2, 
  Eye, 
  X, 
  Image as ImageIcon,
  Download,
  Tag,
  Calendar,
  User,
  FileImage,
  HardDrive
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

interface MediaItem {
  id: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
  title?: string
  description?: string
  tags: string[]
  category?: string
  source?: string
  originalPrompt?: string
  usageCount: number
  createdAt: string
  uploadedBy?: {
    id: string
    name: string
    email: string
  }
}

export default function MediaLibraryPage() {
  const { token } = useAuthStore()
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 100 })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(24)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'campaign', label: 'Campaign' },
    { value: 'product', label: 'Product' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' },
  ]

  const sources = [
    { value: 'all', label: 'All Sources' },
    { value: 'ai-generated', label: 'AI Generated' },
    { value: 'uploaded', label: 'Uploaded' },
    { value: 'edited', label: 'Edited' },
  ]

  useEffect(() => {
    if (token) {
      loadMedia()
      loadStorageUsage()
    }
  }, [token, searchQuery, categoryFilter, sourceFilter, page])

  const loadMedia = async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }
      if (sourceFilter !== 'all') {
        params.append('source', sourceFilter)
      }

      const response = await fetch(`/api/media-library?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMedia(data.media || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error loading media:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStorageUsage = async () => {
    if (!token) return
    try {
      // Get all media to calculate usage
      const response = await fetch('/api/media-library?limit=10000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const totalSize = data.media?.reduce((sum: number, item: MediaItem) => sum + item.fileSize, 0) || 0
        const totalSizeMB = totalSize / (1024 * 1024)
        
        // Get tenant max storage (default 100MB if not available)
        setStorageUsage({ used: totalSizeMB, total: 100 })
      }
    } catch (error) {
      console.error('Error loading storage usage:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit')
      return
    }

    setUploading(true)
    try {
      // Convert file to base64 data URL
      const reader = new FileReader()
      reader.onloadend = async () => {
        const dataUrl = reader.result as string
        
        // Get image dimensions
        const img = new Image()
        img.onload = async () => {
          try {
            const response = await fetch('/api/media-library', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                fileName: file.name,
                fileUrl: dataUrl,
                fileSize: file.size,
                mimeType: file.type,
                width: img.width,
                height: img.height,
                category: 'uploaded',
                source: 'uploaded',
              }),
            })

            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.error || error.message || 'Upload failed')
            }

            // Refresh media list
            loadMedia()
            loadStorageUsage()
            
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          } catch (error: any) {
            console.error('Upload error:', error)
            alert(`Upload failed: ${error.message || 'Please try again'}`)
          } finally {
            setUploading(false)
          }
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message || 'Please try again'}`)
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media item?')) return

    if (!token) return
    try {
      const response = await fetch(`/api/media-library/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Remove from list
        setMedia(media.filter(item => item.id !== id))
        loadStorageUsage()
        if (selectedMedia?.id === id) {
          setSelectedMedia(null)
        }
      } else {
        alert('Failed to delete media')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete media')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-600 mt-1">Manage all your images and media files</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Storage Usage */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
              <HardDrive className="h-4 w-4 text-gray-500" />
              <div className="text-sm">
                <span className="font-medium text-gray-900">
                  {storageUsage.used.toFixed(1)}MB
                </span>
                <span className="text-gray-500"> / {storageUsage.total}MB</span>
              </div>
            </div>
            
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Upload className="h-5 w-5" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, title, description, or tags..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sources.map(src => (
                <option key={src.value} value={src.value}>{src.label}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {media.length} of {total} media files
        </div>

        {/* Media Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : media.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <FileImage className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter !== 'all' || sourceFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload your first image to get started'}
            </p>
            {!searchQuery && categoryFilter === 'all' && sourceFilter === 'all' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload Image
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setSelectedMedia(item)}
              >
                <div className="aspect-square relative bg-gray-100">
                  <img
                    src={item.fileUrl}
                    alt={item.title || item.fileName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedMedia(item)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full hover:bg-gray-100 transition-opacity"
                    >
                      <Eye className="h-4 w-4 text-gray-900" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(item.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.title || item.fileName}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatFileSize(item.fileSize)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {media.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={item.fileUrl}
                        alt={item.title || item.fileName}
                        className="h-16 w-16 object-cover rounded cursor-pointer"
                        onClick={() => setSelectedMedia(item)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.title || item.fileName}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.category && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {item.category}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(item.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedMedia(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Image Preview Modal */}
        {selectedMedia && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedMedia.title || selectedMedia.fileName}
                </h2>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6">
                {/* Image */}
                <div className="mb-6">
                  <img
                    src={selectedMedia.fileUrl}
                    alt={selectedMedia.title || selectedMedia.fileName}
                    className="w-full h-auto rounded-lg"
                  />
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">File Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">File Name:</span>
                        <span className="text-gray-900">{selectedMedia.fileName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size:</span>
                        <span className="text-gray-900">{formatFileSize(selectedMedia.fileSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="text-gray-900">{selectedMedia.mimeType}</span>
                      </div>
                      {selectedMedia.width && selectedMedia.height && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dimensions:</span>
                          <span className="text-gray-900">
                            {selectedMedia.width} × {selectedMedia.height}px
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Metadata</h3>
                    <div className="space-y-2 text-sm">
                      {selectedMedia.category && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="text-gray-900">{selectedMedia.category}</span>
                        </div>
                      )}
                      {selectedMedia.source && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Source:</span>
                          <span className="text-gray-900">{selectedMedia.source}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Usage Count:</span>
                        <span className="text-gray-900">{selectedMedia.usageCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uploaded:</span>
                        <span className="text-gray-900">{formatDate(selectedMedia.createdAt)}</span>
                      </div>
                      {selectedMedia.uploadedBy && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Uploaded By:</span>
                          <span className="text-gray-900">{selectedMedia.uploadedBy.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedMedia.description && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                    <p className="text-sm text-gray-900">{selectedMedia.description}</p>
                  </div>
                )}

                {/* Tags */}
                {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMedia.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Original Prompt (for AI-generated images) */}
                {selectedMedia.originalPrompt && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Original Prompt</h3>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                      {selectedMedia.originalPrompt}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex items-center gap-4 pt-6 border-t border-gray-200">
                  <a
                    href={selectedMedia.fileUrl}
                    download={selectedMedia.fileName}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedMedia.fileUrl)
                      alert('Image URL copied to clipboard!')
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMedia.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

