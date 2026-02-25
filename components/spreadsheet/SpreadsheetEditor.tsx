'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, X, Search, ArrowUpDown, Filter, BarChart3, Table2, Brain, Wand2, Sparkles, Eraser, AlertTriangle, Lightbulb } from 'lucide-react'
import { SpreadsheetRibbon, type RibbonTab } from '@/components/spreadsheet/SpreadsheetRibbon'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { FormulaBar } from '@/components/spreadsheet/FormulaBar'
import { StatusBar } from '@/components/spreadsheet/StatusBar'
import { FindReplaceModal } from '@/components/spreadsheet/FindReplaceModal'
import { applyFindReplace, countFind, applySort, applyFilter, applyFilterByValues, getColumnUniqueValues, computePivot, smartFillNext, type FilterCondition } from '@/lib/spreadsheet/editor-utils'

const MAX_HISTORY = 100
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'

import 'x-data-spreadsheet/dist/xspreadsheet.css'

/** Column index to A1-style letter(s): 0 -> A, 25 -> Z, 26 -> AA */
function colToLetter(col: number): string {
  let s = ''
  let c = col
  do {
    s = String.fromCharCode((c % 26) + 65) + s
    c = Math.floor(c / 26) - 1
  } while (c >= 0)
  return s
}

function getCellRef(row: number, col: number): string {
  return `${colToLetter(col)}${row + 1}`
}

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

/** Get cell text from getData() first sheet */
function getCellTextFromData(data: Record<string, unknown>[] | null, row: number, col: number): string {
  if (!data || !data[0]) return ''
  const sheet = data[0] as Record<string, unknown>
  const rows = (sheet.rows as Record<string, { cells?: Record<string, { text?: string }> }>) || {}
  const rowData = rows[row]
  const cells = rowData?.cells || {}
  const cell = cells[col]
  return cell?.text != null ? String(cell.text) : ''
}

/** Get numeric values from a range in first sheet for status bar */
function getRangeNumericValues(
  data: Record<string, unknown>[] | null,
  sri: number,
  sci: number,
  eri: number,
  eci: number
): number[] {
  if (!data || !data[0]) return []
  const sheet = data[0] as Record<string, unknown>
  const rows = (sheet.rows as Record<string, { cells?: Record<string, { text?: string }> }>) || {}
  const out: number[] = []
  for (let ri = sri; ri <= eri; ri++) {
    const rowData = rows[ri]
    const cells = rowData?.cells || {}
    for (let ci = sci; ci <= eci; ci++) {
      const cell = cells[ci]
      const text = cell?.text != null ? String(cell.text).trim() : ''
      const n = parseFloat(text)
      if (text !== '' && !Number.isNaN(n)) out.push(n)
    }
  }
  return out
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

type SelectionRange = { sri: number; sci: number; eri: number; eci: number }

export function SpreadsheetEditor({ spreadsheetId, backHref, newSpreadsheetHref }: SpreadsheetEditorProps) {
  const router = useRouter()
  const { token } = useAuthStore()
  const [spreadsheetName, setSpreadsheetName] = useState('Untitled Spreadsheet')
  const [isSaving, setIsSaving] = useState(false)
  const [initialData, setInitialData] = useState<Record<string, unknown>[] | null>(null)
  const [activeCell, setActiveCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 })
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null)
  const [formulaValue, setFormulaValue] = useState('')
  const [selectionStats, setSelectionStats] = useState({ sum: 0, count: 0, avg: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const spreadsheetRef = useRef<any>(null)
  const lastDataRef = useRef<Record<string, unknown> | null>(null)
  const historyRef = useRef<Record<string, unknown>[][]>([])
  const historyIndexRef = useRef(-1)
  const skipNextChangeRef = useRef(false)
  const setHistoryStateRef = useRef<(s: { index: number; length: number }) => void>(() => {})
  const [historyState, setHistoryState] = useState({ index: 0, length: 1 })
  setHistoryStateRef.current = setHistoryState
  const formulaBarInputRef = useRef<HTMLInputElement | null>(null)

  const handleGridKeyDown = useCallback((e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
    const key = e.key
    if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight') return
    if (document.activeElement === formulaBarInputRef.current) return
    e.preventDefault()
    const { row, col } = activeCell
    let nextRow = row
    let nextCol = col
    if (key === 'ArrowUp') nextRow = Math.max(0, row - 1)
    else if (key === 'ArrowDown') nextRow = Math.min(9999, row + 1)
    else if (key === 'ArrowLeft') nextCol = Math.max(0, col - 1)
    else if (key === 'ArrowRight') nextCol = Math.min(51, col + 1)
    setActiveCell({ row: nextRow, col: nextCol })
    setSelectionRange(null)
    const s = spreadsheetRef.current as any
    if (s?.cel) {
      try {
        const cellEl = s.cel(nextRow, nextCol, 0)
        if (cellEl?.el) (cellEl.el as HTMLElement)?.click?.()
      } catch (_) {}
    } else if (s?.updateCellSelected) {
      try { s.updateCellSelected(nextRow, nextCol) } catch (_) {}
    }
  }, [activeCell])

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
        containerRef.current.innerHTML = ''
        const opts = {
          mode: 'edit' as const,
          showToolbar: false,
          showGrid: true,
          showContextmenu: true,
          showBottomBar: true,
          view: {
            height: () => (containerRef.current?.clientHeight ?? 500) - 0,
            width: () => containerRef.current?.clientWidth ?? 800,
          },
          row: { len: 10000, height: 25 },
          col: { len: 52, width: 100, indexWidth: 60, minWidth: 60 },
        }

        const dataToLoad = initialData.length ? initialData : [{ name: 'Sheet1', rows: {} }]
        const pushHistory = (data: Record<string, unknown>) => {
          if (skipNextChangeRef.current) {
            skipNextChangeRef.current = false
            return
          }
          const arr = Array.isArray(data) ? data : [data]
          const clone = JSON.parse(JSON.stringify(arr))
          const hist = historyRef.current
          const idx = historyIndexRef.current
          const next = idx < hist.length - 1 ? hist.slice(0, idx + 1) : hist
          next.push(clone)
          if (next.length > MAX_HISTORY) next.shift()
          historyIndexRef.current = next.length - 1
          historyRef.current = next
          setHistoryStateRef.current({ index: historyIndexRef.current, length: next.length })
        }
        const s = Spreadsheet(containerRef.current, opts)
          .loadData(dataToLoad as any)
          .change((data: Record<string, unknown>) => {
            lastDataRef.current = data
            pushHistory(data)
          })
        historyRef.current = [JSON.parse(JSON.stringify(dataToLoad))]
        historyIndexRef.current = 0
        setHistoryState({ index: 0, length: 1 })

        if (typeof s.on === 'function') {
          s.on('cell-selected', (_cell: unknown, rowIndex: number, colIndex: number) => {
            setActiveCell({ row: rowIndex, col: colIndex })
            setSelectionRange(null)
          })
          s.on('cells-selected', (_cell: unknown, params: { sri: number; sci: number; eri: number; eci: number }) => {
            setActiveCell({ row: params.sri, col: params.sci })
            setSelectionRange(params)
          })
        }

        spreadsheetRef.current = s
      })
      .catch((err) => {
        console.error('Failed to load spreadsheet:', err)
      })

    return () => {
      mounted = false
      const instance = spreadsheetRef.current
      spreadsheetRef.current = null
      lastDataRef.current = null
      if (instance && typeof (instance as any).destroy === 'function') {
        try {
          (instance as any).destroy()
        } catch (_) {
          // ignore
        }
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [spreadsheetId, initialData, loadXSpreadsheet])

  // Sync formula bar from active cell
  useEffect(() => {
    const s = spreadsheetRef.current
    if (!s || typeof s.getData !== 'function') return
    const data = s.getData()
    const arr = Array.isArray(data) ? data : data != null ? [data] : []
    setFormulaValue(getCellTextFromData(arr, activeCell.row, activeCell.col))
  }, [activeCell])

  // Selection stats for status bar
  useEffect(() => {
    if (!selectionRange) {
      setSelectionStats({ sum: 0, count: 0, avg: 0 })
      return
    }
    const s = spreadsheetRef.current
    if (!s || typeof s.getData !== 'function') return
    const data = s.getData()
    const arr = Array.isArray(data) ? data : data != null ? [data] : []
    const nums = getRangeNumericValues(
      arr,
      selectionRange.sri,
      selectionRange.sci,
      selectionRange.eri,
      selectionRange.eci
    )
    const count = nums.length
    const sum = nums.reduce((a, b) => a + b, 0)
    setSelectionStats({ sum, count, avg: count ? sum / count : 0 })
  }, [selectionRange])

  const handleFormulaChange = useCallback((val: string) => {
    setFormulaValue(val)
    const s = spreadsheetRef.current
    if (!s || typeof s.cellText !== 'function') return
    s.cellText(activeCell.row, activeCell.col, val, 0)
    const data = s.getData()
    lastDataRef.current = data
    if (typeof s.loadData === 'function') s.loadData(Array.isArray(data) ? data : [data])
  }, [activeCell])

  const handleFormulaCommit = useCallback(() => {
    const s = spreadsheetRef.current
    if (!s || typeof s.getData !== 'function') return
    const data = s.getData()
    lastDataRef.current = data
  }, [])

  const handleInsertCellRef = useCallback(() => {
    const ref = getCellRef(activeCell.row, activeCell.col)
    const input = formulaBarInputRef.current
    if (input) {
      const start = input.selectionStart ?? 0
      const end = input.selectionEnd ?? 0
      const before = formulaValue.slice(0, start)
      const after = formulaValue.slice(end)
      const next = before + ref + after
      setFormulaValue(next)
      handleFormulaChange(next)
      requestAnimationFrame(() => {
        const pos = start + ref.length
        input.setSelectionRange(pos, pos)
        input.focus()
      })
    } else {
      setFormulaValue((v) => v + ref)
      handleFormulaChange(formulaValue + ref)
    }
  }, [activeCell, formulaValue, handleFormulaChange])

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

  const [saveMenuOpen, setSaveMenuOpen] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiQuery, setAiQuery] = useState('')
  const [findReplaceOpen, setFindReplaceOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCol, setFilterCol] = useState(0)
  const [filterCondition, setFilterCondition] = useState<FilterCondition>('contains')
  const [filterValue, setFilterValue] = useState('')
  const [chartData, setChartData] = useState<{ type: 'bar' | 'line' | 'pie'; labels: string[]; values: number[] } | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [pivotOpen, setPivotOpen] = useState(false)
  const [pivotRowCol, setPivotRowCol] = useState(0)
  const [pivotValueCol, setPivotValueCol] = useState(1)
  const [pivotAgg, setPivotAgg] = useState<'sum' | 'count' | 'avg'>('sum')
  const [filterActive, setFilterActive] = useState(false)
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('home')
  const saveMenuRef = useRef<HTMLDivElement>(null)
  const unfilteredDataRef = useRef<string[][] | null>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (saveMenuOpen && saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setSaveMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [saveMenuOpen])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setFindReplaceOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const getCurrentData2D = useCallback((): string[][] => {
    const data = spreadsheetRef.current?.getData() ?? lastDataRef.current
    if (!data) return [[]]
    const sheets = Array.isArray(data) ? data : (data as any).length != null ? Object.values(data) : [data]
    const first = sheets[0]
    if (!first || typeof first !== 'object') return [[]]
    return sheetDataToArray(first as Record<string, unknown>)
  }, [])

  const loadSheetData = useCallback((grid: string[][], skipHistory = false) => {
    const s = spreadsheetRef.current
    if (!s || typeof s.loadData !== 'function') return
    if (skipHistory) skipNextChangeRef.current = true
    const sheets = arrayToSheetData(grid)
    s.loadData(sheets as any)
    lastDataRef.current = s.getData()
  }, [])

  const handleUndo = useCallback(() => {
    const hist = historyRef.current
    const idx = historyIndexRef.current
    if (idx <= 0) return
    const nextIdx = idx - 1
    const data = hist[nextIdx]
    if (!data) return
    const s = spreadsheetRef.current
    if (!s?.loadData) return
    skipNextChangeRef.current = true
    s.loadData(data as any)
    lastDataRef.current = s.getData()
    historyIndexRef.current = nextIdx
    setHistoryState((prev) => ({ ...prev, index: nextIdx }))
  }, [])

  const handleRedo = useCallback(() => {
    const hist = historyRef.current
    const idx = historyIndexRef.current
    if (idx >= hist.length - 1) return
    const nextIdx = idx + 1
    const data = hist[nextIdx]
    if (!data) return
    const s = spreadsheetRef.current
    if (!s?.loadData) return
    skipNextChangeRef.current = true
    s.loadData(data as any)
    lastDataRef.current = s.getData()
    historyIndexRef.current = nextIdx
    setHistoryState((prev) => ({ ...prev, index: nextIdx }))
  }, [])

  const handleShare = useCallback(() => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (!url) return
    navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard')).catch(() => alert('Could not copy link'))
  }, [])

  const handleBold = useCallback(() => {
    const s = spreadsheetRef.current as any
    if (!s) return
    const { row, col } = activeCell
    try {
      if (typeof s.cellStyle === 'function') {
        s.cellStyle(row, col, 0, { style: { font: { bold: true } } })
        return
      }
      if (typeof s.setCellStyle === 'function') {
        s.setCellStyle(row, col, 0, { bold: true })
        return
      }
    } catch (_) {
      // library may not support
    }
  }, [activeCell])

  const handleItalic = useCallback(() => {
    const s = spreadsheetRef.current as any
    if (!s) return
    const { row, col } = activeCell
    try {
      if (typeof s.cellStyle === 'function') s.cellStyle(row, col, 0, { style: { font: { italic: true } } })
      else if (typeof s.setCellStyle === 'function') s.setCellStyle(row, col, 0, { italic: true })
    } catch (_) {}
  }, [activeCell])

  const handleUnderline = useCallback(() => {
    const s = spreadsheetRef.current as any
    if (!s) return
    const { row, col } = activeCell
    try {
      if (typeof s.cellStyle === 'function') s.cellStyle(row, col, 0, { style: { font: { underline: true } } })
      else if (typeof s.setCellStyle === 'function') s.setCellStyle(row, col, 0, { underline: true })
    } catch (_) {}
  }, [activeCell])

  const handleAlignLeft = useCallback(() => {
    const s = spreadsheetRef.current as any
    if (!s?.cellStyle) return
    try {
      const { row, col } = activeCell
      s.cellStyle(row, col, 0, { align: 'left' })
    } catch (_) {}
  }, [activeCell])

  const handleAlignCenter = useCallback(() => {
    const s = spreadsheetRef.current as any
    if (!s?.cellStyle) return
    try {
      const { row, col } = activeCell
      s.cellStyle(row, col, 0, { align: 'center' })
    } catch (_) {}
  }, [activeCell])

  const handleAlignRight = useCallback(() => {
    const s = spreadsheetRef.current as any
    if (!s?.cellStyle) return
    try {
      const { row, col } = activeCell
      s.cellStyle(row, col, 0, { align: 'right' })
    } catch (_) {}
  }, [activeCell])

  const handleMergeCenter = useCallback(() => {
    const s = spreadsheetRef.current as any
    if (!s?.mergeCells) return
    try {
      const sri = selectionRange?.sri ?? activeCell.row
      const sci = selectionRange?.sci ?? activeCell.col
      const eri = selectionRange?.eri ?? activeCell.row
      const eci = selectionRange?.eci ?? activeCell.col
      s.mergeCells(sri, sci, eri, eci, 0)
    } catch (_) {}
  }, [activeCell, selectionRange])

  const handleWrapText = useCallback(() => {
    const s = spreadsheetRef.current as any
    if (!s?.cellStyle) return
    try {
      const { row, col } = activeCell
      s.cellStyle(row, col, 0, { wrapText: true })
    } catch (_) {}
  }, [activeCell])

  const handleAutoSum = useCallback((type: 'sum' | 'average' | 'count' | 'max' | 'min') => {
    const s = spreadsheetRef.current
    if (!s?.cellText) return
    const { row, col } = activeCell
    let startRow: number
    let endRow: number
    let startCol: number
    let endCol: number
    if (selectionRange && (selectionRange.eri - selectionRange.sri > 0 || selectionRange.eci - selectionRange.sci > 0)) {
      startRow = selectionRange.sri
      endRow = selectionRange.eri
      startCol = selectionRange.sci
      endCol = selectionRange.eci
    } else {
      startRow = 0
      endRow = Math.max(0, row - 1)
      startCol = col
      endCol = col
    }
    const refStart = getCellRef(startRow, startCol)
    const refEnd = getCellRef(endRow, endCol)
    const range = refStart === refEnd ? refStart : `${refStart}:${refEnd}`
    const funcMap = { sum: 'SUM', average: 'AVERAGE', count: 'COUNT', max: 'MAX', min: 'MIN' }
    const formula = `=${funcMap[type]}(${range})`
    s.cellText(row, col, formula, 0)
    setFormulaValue(formula)
    lastDataRef.current = s.getData()
    if (typeof s.loadData === 'function') s.loadData(Array.isArray(s.getData()) ? s.getData() : [s.getData()])
  }, [activeCell, selectionRange])

  const handleInsertFunction = useCallback(() => {
    formulaBarInputRef.current?.focus()
  }, [])

  const handleNumberFormat = useCallback((format: string) => {
    const s = spreadsheetRef.current
    if (!s?.cellText || !s?.getData) return
    const grid = getCurrentData2D()
    if (grid.length === 0) return
    const sri = selectionRange?.sri ?? activeCell.row
    const sci = selectionRange?.sci ?? activeCell.col
    const eri = selectionRange?.eri ?? activeCell.row
    const eci = selectionRange?.eci ?? activeCell.col
    const formatCell = (val: string): string => {
      const n = parseFloat(val)
      if (format === 'number' && !Number.isNaN(n)) return n.toFixed(2)
      if (format === 'currency' && !Number.isNaN(n)) return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      if (format === 'percent' && !Number.isNaN(n)) return `${(n * 100).toFixed(2)}%`
      if (format === 'date' && val) return val
      return val
    }
    for (let r = sri; r <= eri; r++) {
      for (let c = sci; c <= eci; c++) {
        const cell = grid[r]?.[c]
        if (cell != null && String(cell).trim() !== '') {
          const formatted = formatCell(String(cell))
          s.cellText(r, c, formatted, 0)
        }
      }
    }
    lastDataRef.current = s.getData()
    if (typeof s.loadData === 'function') s.loadData(Array.isArray(s.getData()) ? s.getData() : [s.getData()])
  }, [activeCell, selectionRange, getCurrentData2D])

  const handleIncreaseDecimal = useCallback(() => {
    handleNumberFormat('number')
  }, [handleNumberFormat])

  const handleDecreaseDecimal = useCallback(() => {
    const s = spreadsheetRef.current
    if (!s?.cellText || !s?.getData) return
    const grid = getCurrentData2D()
    const sri = selectionRange?.sri ?? activeCell.row
    const sci = selectionRange?.sci ?? activeCell.col
    const eri = selectionRange?.eri ?? activeCell.row
    const eci = selectionRange?.eci ?? activeCell.col
    for (let r = sri; r <= eri; r++) {
      for (let c = sci; c <= eci; c++) {
        const cell = grid[r]?.[c]
        if (cell != null && String(cell).trim() !== '') {
          const n = parseFloat(String(cell))
          if (!Number.isNaN(n)) {
            const rounded = Math.round(n)
            s.cellText(r, c, String(rounded), 0)
          }
        }
      }
    }
    lastDataRef.current = s.getData()
    if (typeof s.loadData === 'function') s.loadData(Array.isArray(s.getData()) ? s.getData() : [s.getData()])
  }, [activeCell, selectionRange, getCurrentData2D])

  const handleSaveToDevice = async (format: 'csv' | 'xlsx' | 'xls') => {
    setSaveMenuOpen(false)
    const name = (spreadsheetName || 'spreadsheet').replace(/[^a-zA-Z0-9-_]/g, '_')
    const ext = format === 'xls' ? 'xls' : format

    if (token && spreadsheetId && spreadsheetId !== 'new') {
      try {
        const res = await fetch(`/api/spreadsheets/${spreadsheetId}/export?format=${format}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Export failed')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${name}.${ext}`
        a.click()
        URL.revokeObjectURL(url)
      } catch (e) {
        console.error(e)
        alert('Download failed')
      }
      return
    }

    const grid = getCurrentData2D()
    if (format === 'csv') {
      const csv = grid.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name}.csv`
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(grid)
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    const buf = XLSX.write(wb, { type: 'array', bookType: format })
    const blob = new Blob([buf], {
      type: format === 'xls' ? 'application/vnd.ms-excel' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isLoadingSpreadsheet = initialData === null && spreadsheetId !== 'new'

  const [aiLoading, setAiLoading] = useState(false)
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [aiInsights, setAiInsights] = useState<{ id: string; text: string; type: 'insight' | 'anomaly' }[]>([])
  const [formulaSuggestions, setFormulaSuggestions] = useState<{ formula: string; description: string }[]>([])

  const callSpreadsheetsAI = useCallback(
    async (action: string, params: Record<string, unknown>) => {
      if (!token) return null
      setAiLoading(true)
      setAiMessage(null)
      try {
        const res = await fetch('/api/spreadsheets/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action, ...params }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || res.statusText)
        }
        return await res.json()
      } catch (e) {
        setAiMessage(e instanceof Error ? e.message : 'AI request failed')
        return null
      } finally {
        setAiLoading(false)
      }
    },
    [token]
  )

  const loadInsights = useCallback(async () => {
    const grid = getCurrentData2D()
    if (grid.length === 0) return
    const headers = grid[0] ?? []
    const dataPreview = grid.slice(0, 15)
    const json = await callSpreadsheetsAI('insights', { headers, dataPreview, rowCount: grid.length })
    if (!json) return
    const list: { id: string; text: string; type: 'insight' | 'anomaly' }[] = []
    ;(json.insights || []).forEach((t: string, i: number) => list.push({ id: `i-${i}`, text: t, type: 'insight' }))
    ;(json.anomalies || []).forEach((t: string, i: number) => list.push({ id: `a-${i}`, text: t, type: 'anomaly' }))
    setAiInsights(list)
  }, [getCurrentData2D, callSpreadsheetsAI])

  useEffect(() => {
    if (aiPanelOpen && token) void loadInsights()
  }, [aiPanelOpen, token, loadInsights])

  const handleAIAction = useCallback(
    async (action: string) => {
      const grid = getCurrentData2D()
      const s = spreadsheetRef.current
      if (!s?.cellText) return

      if (action === 'smart-fill') {
        const col = selectionRange != null ? selectionRange.sci : activeCell.col
        const startRow = selectionRange != null ? selectionRange.sri : 0
        const endRow = selectionRange != null ? selectionRange.eri : activeCell.row
        const aboveValues: string[] = []
        for (let r = 0; r < startRow; r++) {
          const row = grid[r]
          if (row && row[col] != null && String(row[col]).trim() !== '') aboveValues.push(String(row[col]).trim())
        }
        const fillRowCount = endRow - startRow + 1
        if (aboveValues.length === 0) {
          setAiMessage('Select empty cells below existing data, or add a few values first')
          return
        }
        const json = await callSpreadsheetsAI('smart-fill', { values: aboveValues, count: fillRowCount })
        const generated = json?.generated
        if (Array.isArray(generated) && generated.length > 0) {
          for (let i = 0; i < fillRowCount && i < generated.length; i++) {
            s.cellText(startRow + i, col, String(generated[i]), 0)
          }
          lastDataRef.current = s.getData()
          if (typeof s.loadData === 'function') s.loadData(Array.isArray(s.getData()) ? s.getData() : [s.getData()])
          setAiMessage(`Smart Fill: ${Math.min(fillRowCount, generated.length)} cells`)
          return
        }
        const nextFromLocal = smartFillNext(aboveValues)
        if (nextFromLocal != null) {
          s.cellText(startRow, col, nextFromLocal, 0)
          lastDataRef.current = s.getData()
          if (typeof s.loadData === 'function') s.loadData(Array.isArray(s.getData()) ? s.getData() : [s.getData()])
          setAiMessage(`Filled: ${nextFromLocal}`)
        }
        return
      }

      if (action === 'suggest-formula') {
        setFormulaSuggestions([])
        const headers = grid[0] ?? []
        const sampleRow = grid[1]
        const json = await callSpreadsheetsAI('formula-suggest', { headers, sampleRow })
        const suggestions = json?.suggestions
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          setFormulaSuggestions(suggestions)
          setAiMessage('Pick a formula below to insert')
        } else if (json?.formula) {
          setFormulaValue(json.formula)
          setAiMessage(json.description || 'Formula suggested')
        }
        return
      }

      if (action === 'create-chart') {
        const sri = selectionRange?.sri ?? 0
        const sci = selectionRange?.sci ?? 0
        const eri = selectionRange?.eri ?? grid.length - 1
        const eci = selectionRange?.eci ?? (grid[0]?.length ?? 1) - 1
        const dataPreview = grid.slice(sri, eri + 1).map((r) => r.slice(sci, eci + 1))
        const json = await callSpreadsheetsAI('chart-recommend', { dataPreview })
        const chartType = (json?.chartType ?? 'bar') as 'bar' | 'line' | 'pie'
        const labels: string[] = []
        const values: number[] = []
        for (let ri = sri; ri <= eri; ri++) {
          labels.push(String(grid[ri]?.[sci] ?? ''))
          const v = parseFloat(String(grid[ri]?.[sci + 1] ?? grid[ri]?.[sci] ?? 0))
          values.push(Number.isNaN(v) ? 0 : v)
        }
        if (labels.length > 0) setChartData({ type: chartType, labels, values })
        return
      }

      if (action === 'clean-data') {
        const col = selectionRange != null ? selectionRange.sci : activeCell.col
        const column = grid.map((row) => String(row[col] ?? ''))
        const json = await callSpreadsheetsAI('clean-data', { column })
        if (json?.cleaned && Array.isArray(json.cleaned)) {
          const maxRow = grid.length - 1
          json.cleaned.forEach((val: string, i: number) => {
            if (i <= maxRow) s.cellText(i, col, String(val), 0)
          })
          lastDataRef.current = s.getData()
          if (typeof s.loadData === 'function') s.loadData(Array.isArray(s.getData()) ? s.getData() : [s.getData()])
          setAiMessage('Column cleaned')
        }
        return
      }

      if (action === 'natural-language') {
        const query = aiQuery.trim()
        if (!query) {
          setAiMessage('Enter a question first')
          return
        }
        const headers = grid[0] ?? []
        const dataPreview = grid.slice(0, 8)
        const json = await callSpreadsheetsAI('nl-query', { query, headers, dataPreview })
        if (json?.type === 'formula' && json?.formula) {
          const insertAt = (json.insertAt as string) || 'A1'
          const match = insertAt.match(/^([A-Z]+)(\d+)$/i)
          if (match) {
            const colStr = match[1].toUpperCase()
            let col1Based = 0
            for (let i = 0; i < colStr.length; i++) col1Based = col1Based * 26 + (colStr.charCodeAt(i) - 64)
            const row = Math.max(0, parseInt(match[2], 10) - 1)
            const col = Math.max(0, col1Based - 1)
            s.cellText(row, col, json.formula, 0)
            lastDataRef.current = s.getData()
            if (typeof s.loadData === 'function') s.loadData(Array.isArray(s.getData()) ? s.getData() : [s.getData()])
          } else {
            setFormulaValue(json.formula)
          }
          setAiMessage(json.description || 'Formula applied')
        } else if (json?.formula) {
          setFormulaValue(json.formula)
          setAiMessage(json.description || 'Formula in bar—apply to cell')
        } else if (json?.result) {
          setAiMessage(json.result)
        }
        return
      }

      if (action === 'find-anomalies') {
        const headers = grid[0] ?? []
        const dataPreview = grid.slice(0, 20)
        const json = await callSpreadsheetsAI('find-anomalies', { headers, dataPreview })
        const anomalies = json?.anomalies || []
        if (anomalies.length > 0) {
          const newList = anomalies.map((t: string, i: number) => ({ id: `anom-${Date.now()}-${i}`, text: t, type: 'anomaly' as const }))
          setAiInsights((prev) => [...newList, ...prev.slice(0, 8)])
          setAiMessage(`Found ${anomalies.length} anomaly(ies)—see Insights`)
        } else {
          setAiMessage('No anomalies detected')
        }
      }
    },
    [getCurrentData2D, callSpreadsheetsAI, selectionRange, activeCell, aiQuery]
  )

  const handleFindAll = useCallback((find: string) => countFind(getCurrentData2D(), find), [getCurrentData2D])
  const handleReplaceFirst = useCallback((find: string, replace: string) => {
    const grid = getCurrentData2D()
    const { grid: next } = applyFindReplace(grid, find, replace, false)
    loadSheetData(next)
  }, [getCurrentData2D, loadSheetData])
  const handleReplaceAll = useCallback((find: string, replace: string) => {
    const grid = getCurrentData2D()
    const { grid: next, count } = applyFindReplace(grid, find, replace, true)
    loadSheetData(next)
    return count
  }, [getCurrentData2D, loadSheetData])

  const handleSort = useCallback((ascending: boolean) => {
    const grid = getCurrentData2D()
    const col = selectionRange != null ? selectionRange.sci : activeCell.col
    loadSheetData(applySort(grid, col, ascending))
  }, [getCurrentData2D, loadSheetData, selectionRange, activeCell.col])

  const handleFilterApply = useCallback(() => {
    const grid = getCurrentData2D()
    unfilteredDataRef.current = grid
    const filtered = applyFilter(grid, filterCol, filterCondition, filterValue)
    loadSheetData(filtered)
    setFilterActive(true)
    setFilterOpen(false)
  }, [getCurrentData2D, loadSheetData, filterCol, filterCondition, filterValue])
  const handleFilterClear = useCallback(() => {
    const prev = unfilteredDataRef.current
    if (prev) {
      loadSheetData(prev)
      unfilteredDataRef.current = null
      setFilterActive(false)
      setFilterOpen(false)
    }
  }, [loadSheetData])

  const handleInsertChart = useCallback(() => {
    const grid = getCurrentData2D()
    if (grid.length < 2) return
    const sri = selectionRange?.sri ?? 0
    const sci = selectionRange?.sci ?? 0
    const eri = selectionRange?.eri ?? grid.length - 1
    const eci = selectionRange?.eci ?? (grid[0]?.length ?? 1) - 1
    const labels: string[] = []
    const values: number[] = []
    for (let ri = sri; ri <= eri; ri++) {
      labels.push(String(grid[ri]?.[sci] ?? ''))
      const v = parseFloat(String(grid[ri]?.[sci + 1] ?? grid[ri]?.[sci] ?? 0))
      values.push(Number.isNaN(v) ? 0 : v)
    }
    if (labels.length === 0) return
    setChartData({ type: 'bar', labels, values })
  }, [getCurrentData2D, selectionRange])

  /** Get chart as PNG blob; calls onBlob(blob) or onBlob(null) on failure */
  const getChartPngBlob = useCallback((onBlob: (b: Blob | null) => void) => {
    const container = chartContainerRef.current
    if (!container) {
      onBlob(null)
      return
    }
    const svg = container.querySelector('svg')
    if (!svg) {
      onBlob(null)
      return
    }
    try {
      const clone = svg.cloneNode(true) as SVGElement
      let w = 600
      let h = 400
      try {
        const bbox = svg.getBBox?.()
        if (bbox?.width && bbox?.height) {
          w = Math.max(1, Math.round(bbox.width))
          h = Math.max(1, Math.round(bbox.height))
        }
      } catch (_) {}
      if (w === 600 && h === 400) {
        w = Math.max(1, svg.scrollWidth || svg.clientWidth || 600)
        h = Math.max(1, svg.scrollHeight || svg.clientHeight || 400)
      }
      clone.setAttribute('width', String(w))
      clone.setAttribute('height', String(h))
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      const svgData = new XMLSerializer().serializeToString(clone)
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, w, h)
            ctx.drawImage(img, 0, 0, w, h)
            canvas.toBlob((b) => {
              URL.revokeObjectURL(url)
              onBlob(b ?? null)
            }, 'image/png')
          } else {
            URL.revokeObjectURL(url)
            onBlob(null)
          }
        } catch (_) {
          URL.revokeObjectURL(url)
          onBlob(null)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        onBlob(null)
      }
      img.src = url
    } catch (_) {
      onBlob(null)
    }
  }, [])

  const handleChartDownloadPng = useCallback(() => {
    getChartPngBlob((b) => {
      if (!b) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(b)
      a.download = `chart-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }, [getChartPngBlob])

  const handleChartCopy = useCallback(() => {
    const triggerDownloadFallback = (blob: Blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `chart-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(a.href)
    }
    requestAnimationFrame(() => {
      getChartPngBlob((b) => {
        if (!b) {
          alert('Chart image could not be generated. Try "Download PNG" instead.')
          return
        }
        if (typeof navigator.clipboard?.write !== 'function') {
          alert('Clipboard not available. Downloading chart as PNG instead.')
          triggerDownloadFallback(b)
          return
        }
        const item = new ClipboardItem({ 'image/png': b })
        navigator.clipboard.write([item]).then(
          () => alert('Chart copied to clipboard'),
          () => {
            alert('Copying images is not supported in this browser. Downloading chart as PNG instead.')
            triggerDownloadFallback(b)
          }
        )
      })
    })
  }, [getChartPngBlob])

  const handlePivotApply = useCallback(() => {
    const grid = getCurrentData2D()
    const pivot = computePivot(grid, pivotRowCol, pivotValueCol, pivotAgg)
    if (pivot.length === 0) return
    const s = spreadsheetRef.current as any
    const data = s?.getData()
    const sheets = Array.isArray(data) ? [...data] : data ? [data] : []
    const pivotSheet = arrayToSheetData(pivot)
    ;(pivotSheet[0] as Record<string, unknown>).name = 'Pivot'
    const newSheets = [...(sheets as any), pivotSheet[0]]
    if (typeof s?.loadData === 'function') s.loadData(newSheets)
    lastDataRef.current = s?.getData()
    const pivotSheetIndex = newSheets.length - 1
    try {
      if (typeof s?.jumpToSheet === 'function') s.jumpToSheet(pivotSheetIndex)
      else if (typeof s?.setSheet === 'function') s.setSheet(pivotSheetIndex)
      else if (typeof s?.setActiveSheet === 'function') s.setActiveSheet(pivotSheetIndex)
    } catch (_) {
      // library may not expose sheet switch API
    }
    setPivotOpen(false)
  }, [getCurrentData2D, pivotRowCol, pivotValueCol, pivotAgg])

  return (
    <div className="relative flex flex-col h-[calc(100vh-8rem)] min-h-[500px] bg-white dark:bg-gray-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      {isLoadingSpreadsheet && (
        <div className="flex-shrink-0 h-1 bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full w-1/3 bg-purple-500 dark:bg-purple-400" style={{ animation: 'loading 1.2s ease-in-out infinite' }} />
        </div>
      )}
      <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-4 px-4 py-2">
          <Link
            href={backHref}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <input
            type="text"
            value={spreadsheetName}
            onChange={(e) => setSpreadsheetName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 dark:text-slate-100"
          />
        </div>
        <SpreadsheetRibbon
          activeTab={ribbonTab}
          onTabChange={setRibbonTab}
          onSave={handleSave}
          isSaving={isSaving}
          saveMenuOpen={saveMenuOpen}
          saveMenuRef={saveMenuRef}
          onSaveMenuToggle={() => setSaveMenuOpen(!saveMenuOpen)}
          onSaveAsCsv={() => handleSaveToDevice('csv')}
          onSaveAsXlsx={() => handleSaveToDevice('xlsx')}
          onSaveAsXls={() => handleSaveToDevice('xls')}
          onFind={() => setFindReplaceOpen(true)}
          onSortAz={() => handleSort(true)}
          onSortZa={() => handleSort(false)}
          onFilter={() => setFilterOpen(true)}
          filterActive={filterActive}
          onFilterClear={handleFilterClear}
          onChart={handleInsertChart}
          onPivot={() => setPivotOpen(true)}
          aiPanelOpen={aiPanelOpen}
          onAiPanelToggle={() => setAiPanelOpen(!aiPanelOpen)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyState.index > 0}
          canRedo={historyState.index < historyState.length - 1}
          onShare={handleShare}
          onNumberFormat={handleNumberFormat}
          onBold={handleBold}
          onItalic={handleItalic}
          onUnderline={handleUnderline}
          onAlignLeft={handleAlignLeft}
          onAlignCenter={handleAlignCenter}
          onAlignRight={handleAlignRight}
          onMergeCenter={handleMergeCenter}
          onWrapText={handleWrapText}
          onIncreaseDecimal={handleIncreaseDecimal}
          onDecreaseDecimal={handleDecreaseDecimal}
          onAutoSum={handleAutoSum}
          onInsertFunction={handleInsertFunction}
        />
      </div>

      <div className="flex-1 min-h-[400px] flex flex-col overflow-hidden">
        {isLoadingSpreadsheet ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 text-gray-500 dark:text-gray-400">
            <p>Loading spreadsheet…</p>
            <div className="w-full max-w-xs h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-purple-500 dark:bg-purple-400 rounded-full" style={{ animation: 'loading 1.2s ease-in-out infinite' }} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex-1 min-w-0">
                <FormulaBar
                inputRef={formulaBarInputRef}
                value={formulaValue}
                onChange={handleFormulaChange}
                onCommit={handleFormulaCommit}
                onCancel={() => {
                  const s = spreadsheetRef.current
                  if (!s?.getData) return
                  const data = s.getData()
                  const arr = Array.isArray(data) ? data : [data]
                  setFormulaValue(getCellTextFromData(arr, activeCell.row, activeCell.col))
                }}
                disabled={!spreadsheetRef.current}
                />
              </div>
              <button
                type="button"
                onClick={handleInsertCellRef}
                className="shrink-0 px-2 py-1 rounded text-xs font-mono bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                title="Insert current cell reference (e.g. for formulas)"
              >
                {getCellRef(activeCell.row, activeCell.col)}
              </button>
            </div>
            <div
              tabIndex={0}
              role="application"
              aria-label="Spreadsheet grid"
              className="flex-1 min-h-[300px] w-full overflow-auto outline-none"
              style={{ minHeight: 300 }}
              onKeyDown={handleGridKeyDown}
              onClick={(e) => (e.currentTarget as HTMLElement).focus()}
            >
              <div
                ref={containerRef}
                data-spreadsheet-container
                className="h-full w-full"
              />
            </div>
            <StatusBar
              sum={selectionStats.sum}
              count={selectionStats.count}
              avg={selectionStats.avg}
              hasSelection={selectionRange != null}
            />
          </>
        )}
      </div>

      <FindReplaceModal
        open={findReplaceOpen}
        onClose={() => setFindReplaceOpen(false)}
        onFindAll={handleFindAll}
        onReplace={handleReplaceFirst}
        onReplaceAll={handleReplaceAll}
      />

      {filterOpen && (() => {
        const grid = getCurrentData2D()
        const headers = grid[0] ?? []
        const maxCol = Math.max(headers.length - 1, 0)
        const uniqueValues = getColumnUniqueValues(grid, filterCol)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setFilterOpen(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-5 flex flex-col" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Filter className="h-4 w-4" /> Filter by column</h3>
              <div className="space-y-3 flex-1 min-h-0">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Column</label>
                  <select value={filterCol} onChange={(e) => setFilterCol(parseInt(e.target.value, 10) || 0)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800">
                    {headers.map((h, i) => (
                      <option key={i} value={i}>{i + 1}. {String(h || `Column ${i}`).slice(0, 40)}</option>
                    ))}
                    {headers.length === 0 && <option value={0}>Column 0</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Condition</label>
                  <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value as FilterCondition)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800">
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="notEquals">Not equals</option>
                    <option value="startsWith">Starts with</option>
                    <option value="greater">Greater than</option>
                    <option value="less">Less than</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Value</label>
                  <input type="text" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm" placeholder="Type or pick below" />
                  {uniqueValues.length > 0 && (
                    <div className="mt-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Quick select from column: </span>
                      <select onChange={(e) => setFilterValue(e.target.value)} className="mt-0.5 w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded text-sm bg-slate-50 dark:bg-slate-800">
                        <option value="">—</option>
                        {uniqueValues.slice(0, 150).map((v, i) => (
                          <option key={i} value={v}>{String(v).slice(0, 60)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={handleFilterApply} className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">OK</button>
                <button type="button" onClick={() => setFilterOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              </div>
            </div>
          </div>
        )
      })()}

      {chartData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setChartData(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[80vh] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Chart</h3>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleChartCopy} className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700" title="Copy chart to clipboard">
                  Copy
                </button>
                <button type="button" onClick={handleChartDownloadPng} className="px-3 py-1.5 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700" title="Download as PNG">
                  Download PNG
                </button>
                <button type="button" onClick={() => setChartData(null)} className="p-1 rounded hover:bg-slate-100"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex gap-2 mb-2">
              {(['bar', 'line', 'pie'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setChartData((c) => c ? { ...c, type: t } : null)} className={`px-2 py-1 rounded text-sm ${chartData.type === t ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{t}</button>
              ))}
            </div>
            <div ref={chartContainerRef} className="h-64">
              {chartData.type === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.labels.map((l, i) => ({ name: l, value: chartData.values[i] ?? 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="rgb(124 58 237)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {chartData.type === 'line' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.labels.map((l, i) => ({ name: l, value: chartData.values[i] ?? 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="rgb(124 58 237)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {chartData.type === 'pie' && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={chartData.labels.map((l, i) => ({ name: l, value: chartData.values[i] ?? 0 }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {chartData.labels.map((_, i) => <Cell key={i} fill={['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5]} />)}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {pivotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPivotOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Table2 className="h-4 w-4" /> Pivot table</h3>
            <p className="text-xs text-slate-500 mb-3">Group by a column and aggregate another.</p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-500">Row (group by) column index</label>
                <input type="number" min={0} value={pivotRowCol} onChange={(e) => setPivotRowCol(parseInt(e.target.value, 10) || 0)} className="w-full px-2 py-1 border rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Value column index</label>
                <input type="number" min={0} value={pivotValueCol} onChange={(e) => setPivotValueCol(parseInt(e.target.value, 10) || 0)} className="w-full px-2 py-1 border rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Aggregate</label>
                <select value={pivotAgg} onChange={(e) => setPivotAgg(e.target.value as 'sum' | 'count' | 'avg')} className="w-full px-2 py-1 border rounded text-sm">
                  <option value="sum">Sum</option>
                  <option value="count">Count</option>
                  <option value="avg">Average</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handlePivotApply} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm">Create Pivot</button>
              <button type="button" onClick={() => setPivotOpen(false)} className="px-3 py-1.5 border rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant panel */}
      {aiPanelOpen && (
        <div className="fixed right-0 top-14 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-30 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">AI Assistant</h2>
            </div>
            <button type="button" onClick={() => setAiPanelOpen(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 flex-1 overflow-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ask AI: total sales by month, clean data, create chart..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleAIAction('natural-language')}
                disabled={aiLoading}
              />
            </div>
            {aiLoading && <p className="text-xs text-slate-500">AI thinking…</p>}
            {aiMessage && <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg p-2">{aiMessage}</p>}

            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Quick actions</h3>
              <div className="space-y-1.5">
                <button type="button" disabled={aiLoading} onClick={() => void handleAIAction('smart-fill')} className="w-full text-left p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-colors flex items-center gap-2 disabled:opacity-50">
                  <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Smart Fill selection</span>
                </button>
                <button type="button" disabled={aiLoading} onClick={() => void handleAIAction('suggest-formula')} className="w-full text-left p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 transition-colors flex items-center gap-2 disabled:opacity-50">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Suggest formula</span>
                </button>
                <button type="button" disabled={aiLoading} onClick={() => void handleAIAction('create-chart')} className="w-full text-left p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors flex items-center gap-2 disabled:opacity-50">
                  <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Create chart</span>
                </button>
                <button type="button" disabled={aiLoading} onClick={() => void handleAIAction('clean-data')} className="w-full text-left p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-transparent hover:border-green-200 dark:hover:border-green-800 transition-colors flex items-center gap-2 disabled:opacity-50">
                  <Eraser className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Clean data</span>
                </button>
                <button type="button" disabled={aiLoading} onClick={() => void handleAIAction('find-anomalies')} className="w-full text-left p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-colors flex items-center gap-2 disabled:opacity-50">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Find anomalies</span>
                </button>
              </div>
            </div>

            {formulaSuggestions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Pick a formula</h3>
                <div className="space-y-1">
                  {formulaSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setFormulaValue(s.formula)
                        setAiMessage(s.description)
                        setFormulaSuggestions([])
                        const spr = spreadsheetRef.current
                        if (spr?.cellText) {
                          spr.cellText(activeCell.row, activeCell.col, s.formula, 0)
                          lastDataRef.current = spr.getData()
                          if (typeof spr.loadData === 'function') spr.loadData(Array.isArray(spr.getData()) ? spr.getData() : [spr.getData()])
                        }
                      }}
                      className="w-full text-left p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 truncate"
                      title={s.description}
                    >
                      {s.formula}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" /> Insights
              </h3>
              {aiInsights.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500">Open the panel to see insights from your data.</p>
              ) : (
                <ul className="space-y-1.5">
                  {aiInsights.map((item) => (
                    <li
                      key={item.id}
                      className={`text-xs p-2 rounded-lg border ${item.type === 'anomaly' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                    >
                      {item.type === 'anomaly' && <AlertTriangle className="w-3.5 h-3.5 inline mr-1 align-middle shrink-0" />}
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
