'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'

interface Document {
  id: string
  title: string
  description?: string
  category?: string
  tags: string[]
  fileUrl: string
  fileName: string
  fileSize: number
  isIndexed: boolean
  uploadedAt: string
  _count: {
    chunks: number
    queries: number
  }
}

interface QueryResult {
  answer: string
  sources: Array<{
    index: number
    documentId: string
    documentTitle: string
    content: string
  }>
  confidence: number
  modelUsed: string
}

export default function KnowledgePage() {
  const { token } = useAuthStore()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [querying, setQuerying] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [selectedCategory])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const url = selectedCategory !== 'all' 
        ? `/api/knowledge/documents?category=${selectedCategory}`
        : '/api/knowledge/documents'
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    try {
      setQuerying(true)
      const response = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        const result = await response.json()
        setQueryResult(result)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to query knowledge base')
      }
    } catch (error) {
      console.error('Error querying:', error)
      alert('Failed to query knowledge base')
    } finally {
      setQuerying(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name.replace(/\.[^/.]+$/, '')) // Remove extension for title
      formData.append('category', 'other')
      
      const response = await fetch('/api/knowledge/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
      alert('Document uploaded successfully! Processing will begin shortly.')
      
      // Refresh document list
      if (fetchDocuments) {
        fetchDocuments()
      }
      
      // Reset file input
      e.target.value = ''
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const categories = [
    { value: 'all', label: 'All Documents' },
    { value: 'sop', label: 'SOPs' },
    { value: 'policy', label: 'Policies' },
    { value: 'contract', label: 'Contracts' },
    { value: 'faq', label: 'FAQs' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge & RAG AI</h1>
          <p className="text-gray-600">Ask questions from your documents and get instant, cited answers</p>
        </div>

        {/* Query Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
          <form onSubmit={handleQuery} className="space-y-4">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
            />
            <button
              type="submit"
              disabled={querying || !query.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {querying ? 'Querying...' : 'Ask Question'}
            </button>
          </form>

          {/* Query Result */}
          {queryResult && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Answer:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{queryResult.answer}</p>
              </div>
              
              {queryResult.sources.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Sources:</h4>
                  <div className="space-y-2">
                    {queryResult.sources.map((source) => (
                      <div key={source.index} className="p-3 bg-white rounded border border-gray-200">
                        <p className="text-sm font-medium text-purple-600 mb-1">
                          Source {source.index}: {source.documentTitle}
                        </p>
                        <p className="text-sm text-gray-600">{source.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-500">
                Confidence: {(queryResult.confidence * 100).toFixed(0)}% | Model: {queryResult.modelUsed}
              </div>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Documents</h2>
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer">
                Upload Document
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No documents yet. Upload your first document to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      doc.isIndexed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.isIndexed ? 'Indexed' : 'Pending'}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {doc.category && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                        {doc.category}
                      </span>
                    )}
                    {doc.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {formatFileSize(doc.fileSize)} • {doc._count.chunks} chunks • {doc._count.queries} queries
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

