'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'

export default function NewSpreadsheetPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [spreadsheetName, setSpreadsheetName] = useState('Untitled Spreadsheet')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!token) {
      alert('Please log in to create a spreadsheet')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/spreadsheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: spreadsheetName,
          template: selectedTemplate,
        }),
      })

      if (response.ok) {
        const spreadsheet = await response.json()
        router.push(`/dashboard/spreadsheets/${spreadsheet.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create spreadsheet')
      }
    } catch (error) {
      console.error('Error creating spreadsheet:', error)
      alert('Failed to create spreadsheet. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/spreadsheets"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Spreadsheet</h1>
            <p className="text-gray-600 mt-1">Create a new spreadsheet with formulas, charts, and collaboration</p>
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

      {/* Spreadsheet Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Spreadsheet Name
        </label>
        <input
          type="text"
          value={spreadsheetName}
          onChange={(e) => setSpreadsheetName(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter spreadsheet name"
        />
      </div>

      {/* Template Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a Template</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Blank', icon: '📄', description: 'Start from scratch' },
            { name: 'GST Invoice', icon: '🧾', description: 'Invoice with tax calculation' },
            { name: 'Expense Tracker', icon: '💰', description: 'Track expenses by category' },
            { name: 'Payroll Sheet', icon: '👥', description: 'Employee salary tracking' },
            { name: 'Inventory', icon: '📦', description: 'Stock management' },
            { name: 'Budget vs Actual', icon: '📊', description: 'Financial planning' },
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

