'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'

export default function NewDocumentPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [documentName, setDocumentName] = useState('Untitled Document')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!token) {
      alert('Please log in to create a document')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: documentName,
          template: selectedTemplate,
        }),
      })

      if (response.ok) {
        const document = await response.json()
        router.push(`/dashboard/docs/${document.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create document')
      }
    } catch (error) {
      console.error('Error creating document:', error)
      alert('Failed to create document. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/docs"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Document</h1>
            <p className="text-gray-600 mt-1">Create a new document with WYSIWYG editing</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {isCreating ? 'Creating...' : 'Create'}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Name
        </label>
        <input
          type="text"
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter document name"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Template</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Blank', icon: '📄', description: 'Start from scratch' },
            { name: 'Business Proposal', icon: '📋', description: 'Professional proposal template' },
            { name: 'Contract', icon: '📝', description: 'Legal contract template' },
            { name: 'Invoice', icon: '🧾', description: 'Invoice template' },
            { name: 'Letter', icon: '✉️', description: 'Business letter format' },
            { name: 'Meeting Notes', icon: '📓', description: 'Meeting minutes template' },
          ].map((template) => {
            const templateKey = template.name.toLowerCase().replace(/\s+/g, '-')
            return (
              <button
                key={template.name}
                onClick={() => setSelectedTemplate(templateKey)}
                className={`p-4 border-2 rounded-lg transition-colors text-left ${
                  selectedTemplate === templateKey
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                <div className="text-2xl mb-2">{template.icon}</div>
                <div className="font-medium text-gray-900">{template.name}</div>
                <div className="text-sm text-gray-600 mt-1">{template.description}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

