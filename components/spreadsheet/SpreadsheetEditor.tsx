'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Download, Upload, Share2, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuthStore } from '@/lib/stores/auth'

const HotTable = dynamic(() => import('@handsontable/react-wrapper').then((mod) => mod.HotTable), { ssr: false })
const HotColumn = dynamic(() => import('@handsontable/react-wrapper').then((mod) => mod.HotColumn), { ssr: false })

interface SpreadsheetEditorProps {
  spreadsheetId: string
  backHref: string
  newSpreadsheetHref?: string
}

export function SpreadsheetEditor({ spreadsheetId, backHref, newSpreadsheetHref }: SpreadsheetEditorProps) {
  const router = useRouter()
  const { token } = useAuthStore()
  const [spreadsheetName, setSpreadsheetName] = useState('Untitled Spreadsheet')
  const [data, setData] = useState<any[][]>([[]])
  const [isSaving, setIsSaving] = useState(false)
  const hotTableRef = useRef<any>(null)

  useEffect(() => {
    if (spreadsheetId && spreadsheetId !== 'new') {
      loadSpreadsheet()
    } else if (spreadsheetId === 'new' && newSpreadsheetHref) {
      router.push(newSpreadsheetHref)
    }
  }, [spreadsheetId, router, newSpreadsheetHref])

  const loadSpreadsheet = async () => {
    if (!token) return
    try {
      const response = await fetch(`/api/spreadsheets/${spreadsheetId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const spreadsheet = await response.json()
        setSpreadsheetName(spreadsheet.name)
        setData(spreadsheet.data || [[]])
      }
    } catch (error) {
      console.error('Error loading spreadsheet:', error)
    }
  }

  const handleSave = async () => {
    if (!token) {
      alert('Please log in to save')
      return
    }

    setIsSaving(true)
    try {
      const hotInstance = hotTableRef.current?.hotInstance
      const currentData = hotInstance?.getData() || data

      const response = await fetch(`/api/spreadsheets/${spreadsheetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: spreadsheetName,
          data: currentData,
        }),
      })

      if (response.ok) {
        // Success
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save spreadsheet')
      }
    } catch (error) {
      console.error('Error saving spreadsheet:', error)
      alert('Failed to save spreadsheet. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = () => {
    const hotInstance = hotTableRef.current?.hotInstance
    if (hotInstance) {
      const csv = hotInstance.getPlugin('exportFile').exportAsString('csv')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${spreadsheetName}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <input
            type="text"
            value={spreadsheetName}
            onChange={(e) => setSpreadsheetName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 dark:text-gray-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <BarChart3 className="h-4 w-4" />
            Charts
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">Formula:</span>
        <input
          type="text"
          className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
          placeholder="Enter formula (e.g., =SUM(A1:A10))"
        />
      </div>

      <div className="flex-1 overflow-auto">
        {typeof window !== 'undefined' && (
          <HotTable
            ref={hotTableRef}
            data={data}
            width="100%"
            height="100%"
            colHeaders={true}
            rowHeaders={true}
            contextMenu={true}
            manualColumnResize={true}
            manualRowResize={true}
            filters={true}
            dropdownMenu={true}
            licenseKey="non-commercial-and-evaluation"
            afterChange={(changes: any) => {
              if (changes) {
                const hotInstance = hotTableRef.current?.hotInstance
                setData(hotInstance?.getData() || [[]])
              }
            }}
          >
            <HotColumn />
            <HotColumn />
            <HotColumn />
            <HotColumn />
            <HotColumn />
            <HotColumn />
            <HotColumn />
            <HotColumn />
            <HotColumn />
            <HotColumn />
          </HotTable>
        )}
      </div>
    </div>
  )
}
