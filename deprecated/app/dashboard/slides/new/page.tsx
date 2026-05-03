'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewPresentationPage() {
  const router = useRouter()
  const [presentationName, setPresentationName] = useState('Untitled Presentation')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: presentationName,
          template: 'blank',
        }),
      })
      if (response.ok) {
        const presentation = await response.json()
        router.push(`/dashboard/slides/${presentation.id}`)
      }
    } catch (error) {
      console.error('Error creating presentation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/slides"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Presentation</h1>
            <p className="text-gray-600 mt-1">Create a new presentation with themes and animations</p>
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
          Presentation Name
        </label>
        <input
          type="text"
          value={presentationName}
          onChange={(e) => setPresentationName(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter presentation name"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Template</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Blank', icon: '📄', description: 'Start from scratch' },
            { name: 'Business', icon: '💼', description: 'Professional business template' },
            { name: 'Marketing', icon: '📊', description: 'Marketing pitch template' },
            { name: 'Education', icon: '🎓', description: 'Educational presentation' },
            { name: 'Portfolio', icon: '🎨', description: 'Creative portfolio template' },
            { name: 'Report', icon: '📈', description: 'Data report template' },
          ].map((template) => (
            <button
              key={template.name}
              className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="text-2xl mb-2">{template.icon}</div>
              <div className="font-medium text-gray-900">{template.name}</div>
              <div className="text-sm text-gray-600 mt-1">{template.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

