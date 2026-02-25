'use client'

import {
  Save,
  Download,
  Share2,
  CornerDownLeft,
  CornerDownRight,
  Search,
  Filter,
  BarChart3,
  Table2,
  Bold,
  Wand2,
} from 'lucide-react'

const btn =
  'p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

interface SpreadsheetToolbarProps {
  onSave: () => void
  isSaving: boolean
  saveMenuOpen: boolean
  saveMenuRef: React.RefObject<HTMLDivElement | null>
  onSaveMenuToggle: () => void
  onSaveAsCsv: () => void
  onSaveAsXlsx: () => void
  onSaveAsXls: () => void
  onFind: () => void
  onSortAz: () => void
  onSortZa: () => void
  onFilter: () => void
  filterActive: boolean
  onFilterClear: () => void
  onChart: () => void
  onPivot: () => void
  aiPanelOpen: boolean
  onAiPanelToggle: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onShare: () => void
  onNumberFormat: (format: string) => void
  onBold?: () => void
  onUpload?: () => void
}

export function SpreadsheetToolbar({
  onSave,
  isSaving,
  saveMenuOpen,
  saveMenuRef,
  onSaveMenuToggle,
  onSaveAsCsv,
  onSaveAsXlsx,
  onSaveAsXls,
  onFind,
  onSortAz,
  onSortZa,
  onFilter,
  filterActive,
  onFilterClear,
  onChart,
  onPivot,
  aiPanelOpen,
  onAiPanelToggle,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onShare,
  onNumberFormat,
  onBold,
  onUpload,
}: SpreadsheetToolbarProps) {
  return (
    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 py-1.5 flex-wrap">
      {/* File */}
      <div className="flex items-center gap-0.5">
        <button type="button" onClick={onSave} disabled={isSaving} className={btn} title="Save">
          <Save className="h-4 w-4" />
        </button>
        <div className="relative" ref={saveMenuRef}>
          <button type="button" onClick={onSaveMenuToggle} className={btn} title="Download">
            <Download className="h-4 w-4" />
          </button>
          {saveMenuOpen && (
            <div className="absolute left-0 top-full mt-1 z-20 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1">
              <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onSaveAsCsv}>Save as CSV</button>
              <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onSaveAsXlsx}>Save as Excel (.xlsx)</button>
              <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onSaveAsXls}>Save as Excel 97-2003 (.xls)</button>
            </div>
          )}
        </div>
        <button type="button" onClick={onShare} className={btn} title="Share (copy link)">
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Edit: Undo, Redo, Find */}
      <div className="flex items-center gap-0.5 px-2 border-l border-slate-200 dark:border-slate-700">
        <button type="button" onClick={onUndo} disabled={!canUndo} className={btn} title="Undo">
          <CornerDownLeft className="h-4 w-4" />
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo} className={btn} title="Redo">
          <CornerDownRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={onFind} className={btn} title="Find (Ctrl+F)">
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Data: Sort, Filter, Chart, Pivot */}
      <div className="flex items-center gap-0.5 px-2 border-l border-slate-200 dark:border-slate-700">
        <button type="button" onClick={onSortAz} className={btn} title="Sort A–Z">A–Z</button>
        <button type="button" onClick={onSortZa} className={btn} title="Sort Z–A">Z–A</button>
        <button type="button" onClick={onFilter} className={`${btn} ${filterActive ? 'bg-purple-100 dark:bg-purple-900/30' : ''}`} title="Filter">
          <Filter className="h-4 w-4" />
        </button>
        {filterActive && (
          <button type="button" onClick={onFilterClear} className="px-2 py-1 rounded text-xs border border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
            Clear filter
          </button>
        )}
        <button type="button" onClick={onChart} className={btn} title="Chart from selection">
          <BarChart3 className="h-4 w-4" />
        </button>
        <button type="button" onClick={onPivot} className={btn} title="Pivot table">
          <Table2 className="h-4 w-4" />
        </button>
      </div>

      {/* Format */}
      <div className="flex items-center gap-0.5 px-2 border-l border-slate-200 dark:border-slate-700">
        <button type="button" onClick={onBold} className={btn} title="Bold (if supported by sheet)">
          <Bold className="h-4 w-4" />
        </button>
        <select
          className="p-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          title="Number format"
          onChange={(e) => onNumberFormat(e.target.value)}
          defaultValue="normal"
        >
          <option value="normal">Normal</option>
          <option value="currency">₹ Currency</option>
          <option value="percent">%</option>
          <option value="number">Number (2 decimals)</option>
          <option value="date">Date</option>
        </select>
      </div>

      {/* AI – single entry */}
      <div className="flex items-center gap-0.5 ml-auto px-2 border-l border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onAiPanelToggle}
          className={`p-1.5 rounded ${aiPanelOpen ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400'}`}
          title="AI Assistant"
        >
          <Wand2 className="h-4 w-4" />
        </button>
        {onUpload && (
          <button type="button" onClick={onUpload} className="px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
            Upload .xlsx
          </button>
        )}
      </div>
    </div>
  )
}
