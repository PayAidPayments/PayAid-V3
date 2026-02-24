'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Download, Upload, Share2, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'

import 'x-data-spreadsheet/dist/xspreadsheet.css'

/** Convert legacy array-of-arrays to x-spreadsheet sheet format */
function arrayToSheetData(data: unknown[][]): Record<string, unknown>[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [{ name: 'Sheet1', rows: {} }]
  }
  const rows: Record<string, { cells: Record<string, { text: string }> }> = {}
  data.forEach((row, ri) => {
    if (!Array.isArray(row)) return
    const cells: Record<string, { text: string }> = {}
    row.forEach((cell, ci) => {
      if (cell != null && String(cell).trim() !== '') {
        cells[ci] = { text: String(cell) }
      }
    })
    if (Object.keys(cells).length > 0) {
      rows[ri] = { cells }
    }
  })
  return [{ name: 'Sheet1', rows }]
}

/** Check if stored data is legacy array-of-arrays */
function isLegacyData(data: unknown): data is unknown[][] {
  return Array.isArray(data) && (data.length === 0 || Array.isArray(data[0]))
}

/** Normalize API data for x-spreadsheet loadData (array of sheets) */
function normalizeSheetData(apiData: unknown): Record<string, unknown>[] {
  if (apiData == null) return [{ name: 'Sheet1', rows: {} }]
  if (isLegacyData(apiData)) return arrayToSheetData(apiData)
  if (Array.isArray(apiData) && apiData.length > 0) return apiData as Record<string, unknown>[]
  return [{ name: 'Sheet1', rows: {} }]
}

/** Get plain 2D array from x-spreadsheet getData() for CSV/export */
function sheetDataToArray(sheetData: Record<string, unknown>): string[][] {
  const rows = (sheetData.rows as Record<string, { cells?: Record<string, { text?: string }> }>) || {}
  const rowIndices = Object.keys(rows)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b)
  if (rowIndices.length === 0) return [[]]
  const maxRow = Math.max(...rowIndices)
  const result: string[][] = []
  for (let ri = 0; ri <= maxRow; ri++) {
    const row = rows[ri]
    const cells = row?.cells || {}
    const colIndices = Object.keys(cells)
      .map(Number)
      .filter((n) => !Number.isNaN(n))
    const maxCol = colIndices.length ? Math.max(...colIndices) : -1
    const line: string[] = []
    for (let ci = 0; ci <= maxCol; ci++) {
      const cell = cells[ci]
      line.push(cell?.text != null ? String(cell.text) : '')
    }
    result.push(line)
  }
  return result
}

function escapeCsvCell(value: string): string {
  if (/[,"\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

interface SpreadsheetEditorProps {
  spreadsheetId: string
  backHref: string
  newSpreadsheetHref?: string
}

export function SpreadsheetEditor({ spreadsheetId, backHref, newSpreadsheetHref }: SpreadsheetEditorProps) {
  const router = useRouter()
  const { token } = useAuthStore()
  const [spreadsheetName, setSpreadsheetName] = useState('Untitled Spreadsheet')
  const [isSaving, setIsSaving] = useState(false)
  const [initialData, setInitialData] = useState<Record<string, unknown>[] | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const spreadsheetRef = useRef<import('x-data-spreadsheet').default | null>(null)
  const lastDataRef = useRef<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (spreadsheetId && spreadsheetId !== 'new') {
      setInitialData(null)
      loadSpreadsheet()
    } else if (spreadsheetId === 'new' && newSpreadsheetHref) {
      router.push(newSpreadsheetHref)
    }
  }, [spreadsheetId, router, newSpreadsheetHref])

  const loadSpreadsheet = useCallback(async () => {
    if (!token) return
    try {
      const response = await fetch(`/api/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const spreadsheet = await response.json()
        setSpreadsheetName(spreadsheet.name || 'Untitled Spreadsheet')
        const normalized = normalizeSheetData(spreadsheet.data)
        setInitialData(normalized)
      }
    } catch (error) {
      console.error('Error loading spreadsheet:', error)
    }
  }, [spreadsheetId, token])

  // Load x-spreadsheet UMD bundle via script tag (dist has no ES export, sets window.x_spreadsheet)
  const loadXSpreadsheet = useCallback((): Promise<(el: HTMLElement, opts: any) => any> => {
    if (typeof window !== 'undefined' && (window as any).x_spreadsheet) {
      return Promise.resolve((window as any).x_spreadsheet)
    }
    return new Promise((resolve, reject) => {
      const id = 'x-spreadsheet-script'
      if (document.getElementById(id)) {
        const fn = (window as any).x_spreadsheet
        return fn ? resolve(fn) : reject(new Error('x_spreadsheet not available'))
      }
      const script = document.createElement('script')
      script.id = id
      script.src = 'https://unpkg.com/x-data-spreadsheet@1.1.9/dist/xspreadsheet.js'
      script.async = true
      script.onload = () => {
        const fn = (window as any).x_spreadsheet
        fn ? resolve(fn) : reject(new Error('x_spreadsheet not set'))
      }
      script.onerror = () => reject(new Error('Failed to load x-spreadsheet script'))
      document.head.appendChild(script)
    })
  }, [])

  // Create x-spreadsheet instance when container and initial data are ready
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || initialData === null) return

    let mounted = true
    loadXSpreadsheet()
      .then((Spreadsheet) => {
        if (!mounted || !containerRef.current) return
        const opts = {
          mode: 'edit' as const,
          showToolbar: true,
          showGrid: true,
          showContextmenu: true,
          showBottomBar: true,
          view: {
            height: () => containerRef.current?.clientHeight ?? 500,
            width: () => containerRef.current?.clientWidth ?? 800,
          },
          row: { len: 100, height: 25 },
          col: { len: 26, width: 100, indexWidth: 60, minWidth: 60 },
        }

        const dataToLoad = initialData.length ? initialData : [{ name: 'Sheet1', rows: {} }]
        const s = Spreadsheet(containerRef.current, opts)
          .loadData(dataToLoad as any)
          .change((data: Record<string, unknown>) => {
            lastDataRef.current = data
          })

        spreadsheetRef.current = s
      })
      .catch((err) => {
        console.error('Failed to load spreadsheet:', err)
      })

    return () => {
      mounted = false
      spreadsheetRef.current = null
      lastDataRef.current = null
    }
  }, [spreadsheetId, initialData, loadXSpreadsheet])

  const saveToApi = useCallback(
    async (data: Record<string, unknown>) => {
      if (!token || !spreadsheetId) return
      setIsSaving(true)
      try {
        const response = await fetch(`/api/spreadsheets/${spreadsheetId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: spreadsheetName, data }),
        })
        if (!response.ok) {
          const err = await response.json()
          alert(err.error || 'Failed to save spreadsheet')
        }
      } catch (error) {
        console.error('Error saving spreadsheet:', error)
        alert('Failed to save spreadsheet. Please try again.')
      } finally {
        setIsSaving(false)
      }
    },
    [token, spreadsheetId, spreadsheetName]
  )

  const handleSave = async () => {
    const data = spreadsheetRef.current?.getData() ?? lastDataRef.current
    if (data) await saveToApi(data)
    else if (lastDataRef.current) await saveToApi(lastDataRef.current)
    else alert('No data to save')
  }

  const handleExport = () => {
    const data = spreadsheetRef.current?.getData() ?? lastDataRef.current
    if (!data) return
    const sheets = Array.isArray(data) ? data : (data as any).length != null ? Object.values(data) : [data]
    const firstSheet = sheets[0]
    if (!firstSheet || typeof firstSheet !== 'object') return
    const rows = sheetDataToArray(firstSheet as Record<string, unknown>)
    const csv = rows
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${spreadsheetName || 'spreadsheet'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[500px] bg-white dark:bg-gray-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
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
            <Upload className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download className="h-4 w-4" />
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

      <div className="flex-1 min-h-[400px] flex flex-col overflow-hidden">
        {initialData === null && spreadsheetId !== 'new' ? (
          <div className="flex items-center justify-center flex-1 text-gray-500 dark:text-gray-400">
            Loading spreadsheet...
          </div>
        ) : (
          <div
            ref={containerRef}
            className="flex-1 min-h-[400px] w-full overflow-hidden"
            style={{ minHeight: 400 }}
          />
        )}
      </div>
    </div>
  )
}
