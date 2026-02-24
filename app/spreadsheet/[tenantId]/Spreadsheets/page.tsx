'use client'

import { useState, useEffect } from 'react'
import { Plus, FileSpreadsheet, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SpreadsheetsListPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [searchQuery, setSearchQuery] = useState('')
  const [spreadsheets, setSpreadsheets] = useState<any[]>([])
  const { token } = useAuthStore()

  useEffect(() => {
    if (token) {
      loadSpreadsheets()
    }
  }, [token])

  const loadSpreadsheets = async () => {
    if (!token) return
    try {
      const response = await fetch('/api/spreadsheets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSpreadsheets(data.spreadsheets || [])
      }
    } catch (error) {
      console.error('Error loading spreadsheets:', error)
    }
  }

  const filteredSpreadsheets = spreadsheets.filter(
    (s) =>
      !searchQuery ||
      (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Spreadsheets</CardTitle>
          <CardDescription>
            Create and manage spreadsheets with formulas, charts, and collaboration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search spreadsheets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800"
              />
            </div>
            <Link
              href={`/spreadsheet/${tenantId}/Spreadsheets/create`}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Spreadsheet
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Link
              href={`/spreadsheet/${tenantId}/Spreadsheets/create`}
              className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Plus className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" />
              <span className="text-gray-600 dark:text-gray-400 font-medium">New Spreadsheet</span>
            </Link>

            {filteredSpreadsheets.length > 0 ? (
              filteredSpreadsheets.map((spreadsheet) => (
                <Link
                  key={spreadsheet.id}
                  href={`/spreadsheet/${tenantId}/Spreadsheets/${spreadsheet.id}`}
                  className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <FileSpreadsheet className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {spreadsheet.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Updated {new Date(spreadsheet.updatedAt).toLocaleDateString()}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <FileSpreadsheet className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
                <p>
                  {searchQuery
                    ? 'No spreadsheets match your search.'
                    : 'No spreadsheets yet. Create your first one!'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
