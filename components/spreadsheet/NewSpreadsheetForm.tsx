'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Shared "New Spreadsheet" form used at both /Spreadsheets/new and /Spreadsheets/create
 * so both URLs stay in the spreadsheet module and never redirect to dashboard.
 */
export function NewSpreadsheetForm() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [spreadsheetName, setSpreadsheetName] = useState('Untitled Spreadsheet')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank')
  const [isCreating, setIsCreating] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const t = searchParams.get('template')
    if (t && ['blank', 'gst-invoice', 'expense-tracker', 'payroll'].includes(t)) {
      setSelectedTemplate(t)
    }
  }, [searchParams])

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
        router.push(`/spreadsheet/${tenantId}/Spreadsheets/${spreadsheet.id}`)
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

  const templates = [
    { key: 'blank', name: 'Blank', icon: '📄', description: 'Start from scratch' },
    { key: 'gst-invoice', name: 'GST Invoice', icon: '🧾', description: 'Invoice with tax calculation' },
    { key: 'expense-tracker', name: 'Expense Tracker', icon: '💰', description: 'Track expenses by category' },
    { key: 'payroll', name: 'Payroll Sheet', icon: '👥', description: 'Employee salary tracking' },
  ]

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link
              href={`/spreadsheet/${tenantId}/Spreadsheets`}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Spreadsheet</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create a new spreadsheet with formulas, charts, and collaboration
              </p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Spreadsheet Name</CardTitle>
            <CardDescription>Give your spreadsheet a name</CardDescription>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={spreadsheetName}
              onChange={(e) => setSpreadsheetName(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800"
              placeholder="Enter spreadsheet name"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Choose a Template</CardTitle>
            <CardDescription>Start from a template or blank sheet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {templates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => setSelectedTemplate(template.key)}
                  className={`p-4 border-2 rounded-lg transition-colors text-left ${
                    selectedTemplate === template.key
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:bg-purple-900/10'
                  }`}
                >
                  <div className="text-2xl mb-2">{template.icon}</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{template.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
