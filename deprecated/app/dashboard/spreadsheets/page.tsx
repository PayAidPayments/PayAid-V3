'use client'

import { useState, useEffect } from 'react'
import { Plus, FileSpreadsheet, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'

export default function SpreadsheetsPage() {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PayAid Spreadsheet</h1>
          <p className="text-gray-600 mt-1">Create and manage spreadsheets with formulas, charts, and collaboration</p>
        </div>
        <Link
          href="/dashboard/spreadsheets/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Spreadsheet
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search spreadsheets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="h-5 w-5" />
          Filter
        </button>
      </div>

      {/* Spreadsheets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* New Spreadsheet Card */}
        <Link
          href="/dashboard/spreadsheets/new"
          className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <Plus className="h-12 w-12 text-gray-400 mb-2" />
          <span className="text-gray-600 font-medium">New Spreadsheet</span>
        </Link>

        {/* Existing Spreadsheets */}
        {spreadsheets.length > 0 ? (
          spreadsheets.map((spreadsheet) => (
            <Link
              key={spreadsheet.id}
              href={`/dashboard/spreadsheets/${spreadsheet.id}`}
              className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <FileSpreadsheet className="h-8 w-8 text-blue-600 mb-2" />
              <div className="font-medium text-gray-900">{spreadsheet.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                Updated {new Date(spreadsheet.updatedAt).toLocaleDateString()}
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center text-gray-500 py-12 col-span-full">
            <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No spreadsheets yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  )
}

