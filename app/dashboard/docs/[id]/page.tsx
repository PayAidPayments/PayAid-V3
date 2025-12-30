'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Download, Share2, History, Users } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuthStore } from '@/lib/stores/auth'

// Dynamically import Tiptap to avoid SSR issues
const Editor = dynamic(() => import('@/components/editors/DocumentEditor'), { ssr: false })

export default function DocumentEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const documentId = params?.id as string
  const [documentName, setDocumentName] = useState('Untitled Document')
  const [content, setContent] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (documentId && documentId !== 'new') {
      loadDocument()
    } else if (documentId === 'new') {
      // Redirect to new page
      router.push('/dashboard/docs/new')
    }
  }, [documentId, router])

  const loadDocument = async () => {
    if (!token) return
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const document = await response.json()
        setDocumentName(document.name)
        setContent(document.content)
      }
    } catch (error) {
      console.error('Error loading document:', error)
    }
  }

  const handleSave = async (editorContent: any) => {
    if (!token) {
      alert('Please log in to save')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: documentName,
          content: editorContent || content,
        }),
      })

      if (response.ok) {
        // Success - could show a toast notification here
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save document')
      }
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Failed to save document. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/docs"
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <input
            type="text"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <History className="h-4 w-4" />
            Version History
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-4 w-4" />
            Collaborators
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            onClick={() => handleSave(content)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full">
        {typeof window !== 'undefined' && (
          <Editor
            content={content}
            onChange={setContent}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  )
}

