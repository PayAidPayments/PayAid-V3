'use client'

import { useState } from 'react'
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
  Italic,
  Underline,
  Wand2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Merge,
  Type,
  Sigma,
  ChevronDown,
  Minus,
  Plus,
  Copy,
  Scissors,
  ClipboardPaste,
  Paintbrush,
} from 'lucide-react'

const tabBtn =
  'px-4 py-2 text-sm font-medium rounded-t border-b-2 border-transparent -mb-px hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors'
const tabBtnActive =
  'px-4 py-2 text-sm font-medium rounded-t border-b-2 border-purple-500 -mb-px bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
const ribBtn =
  'p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50'
const ribGroupLabel = 'text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1'
const ribGroup = 'flex flex-col border-r border-slate-200 dark:border-slate-600 pr-4 last:border-r-0'

export type RibbonTab = 'home' | 'insert' | 'formulas' | 'data'

export interface SpreadsheetRibbonProps {
  activeTab: RibbonTab
  onTabChange: (tab: RibbonTab) => void
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
  onItalic?: () => void
  onUnderline?: () => void
  onAlignLeft?: () => void
  onAlignCenter?: () => void
  onAlignRight?: () => void
  onMergeCenter?: () => void
  onWrapText?: () => void
  onIncreaseDecimal?: () => void
  onDecreaseDecimal?: () => void
  onAutoSum?: (type: 'sum' | 'average' | 'count' | 'max' | 'min') => void
  onInsertFunction?: () => void
  onUpload?: () => void
}

export function SpreadsheetRibbon({
  activeTab,
  onTabChange,
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
  onItalic,
  onUnderline,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onMergeCenter,
  onWrapText,
  onIncreaseDecimal,
  onDecreaseDecimal,
  onAutoSum,
  onInsertFunction,
  onUpload,
}: SpreadsheetRibbonProps) {
  const [autoSumOpen, setAutoSumOpen] = useState(false)

  return (
    <div className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
      {/* Quick Access + Tabs row */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center">
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-r border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onSave} disabled={isSaving} className={ribBtn} title="Save">
              <Save className="h-4 w-4" />
            </button>
            <button type="button" onClick={onUndo} disabled={!canUndo} className={ribBtn} title="Undo">
              <CornerDownLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={onRedo} disabled={!canRedo} className={ribBtn} title="Redo">
              <CornerDownRight className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex items-center gap-0.5 px-2">
            {(['home', 'insert', 'formulas', 'data'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={activeTab === tab ? tabBtnActive : tabBtn}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 px-3">
          <div className="relative" ref={saveMenuRef}>
            <button type="button" onClick={onSaveMenuToggle} className={ribBtn} title="Download">
              <Download className="h-4 w-4" />
            </button>
            {saveMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-30 w-52 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
                <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onSaveAsCsv}>Save as CSV</button>
                <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onSaveAsXlsx}>Save as Excel (.xlsx)</button>
                <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onSaveAsXls}>Save as Excel 97-2003 (.xls)</button>
              </div>
            )}
          </div>
          <button type="button" onClick={onShare} className={ribBtn} title="Share">
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onAiPanelToggle}
            className={`p-1.5 rounded ${aiPanelOpen ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400'}`}
            title="AI Assistant"
          >
            <Wand2 className="h-4 w-4" />
          </button>
          {onUpload && (
            <button type="button" onClick={onUpload} className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
              Upload .xlsx
            </button>
          )}
        </div>
      </div>

      {/* Ribbon content by tab */}
      <div className="px-3 py-2.5 flex flex-wrap items-end gap-x-6 gap-y-3">
        {activeTab === 'home' && (
          <>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Clipboard</div>
              <div className="flex items-center gap-0.5">
                <button type="button" className={ribBtn} title="Paste">
                  <ClipboardPaste className="h-4 w-4" />
                </button>
                <button type="button" className={ribBtn} title="Cut">
                  <Scissors className="h-4 w-4" />
                </button>
                <button type="button" className={ribBtn} title="Copy">
                  <Copy className="h-4 w-4" />
                </button>
                <button type="button" className={ribBtn} title="Format Painter">
                  <Paintbrush className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Font</div>
              <div className="flex items-center gap-0.5 flex-wrap">
                <select className="h-7 min-w-[90px] text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2" title="Font">
                  <option>Calibri</option>
                  <option>Arial</option>
                  <option>Times New Roman</option>
                </select>
                <select className="h-7 w-12 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1" title="Font size">
                  <option>11</option>
                  <option>12</option>
                  <option>14</option>
                </select>
                <button type="button" onClick={onBold} className={ribBtn} title="Bold">
                  <Bold className="h-4 w-4 font-bold" />
                </button>
                <button type="button" onClick={onItalic} className={ribBtn} title="Italic">
                  <Italic className="h-4 w-4 italic" />
                </button>
                <button type="button" onClick={onUnderline} className={ribBtn} title="Underline">
                  <Underline className="h-4 w-4" />
                </button>
                <button type="button" className={ribBtn} title="Fill color">
                  <span className="w-4 h-4 block border border-slate-400 rounded" style={{ background: 'linear-gradient(to bottom, #fef08a 0%, #fef08a 100%)' }} />
                </button>
                <button type="button" className={ribBtn} title="Font color">
                  <Type className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Alignment</div>
              <div className="flex items-center gap-0.5 flex-wrap">
                <button type="button" onClick={onAlignLeft} className={ribBtn} title="Align Left">
                  <AlignLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={onAlignCenter} className={ribBtn} title="Align Center">
                  <AlignCenter className="h-4 w-4" />
                </button>
                <button type="button" onClick={onAlignRight} className={ribBtn} title="Align Right">
                  <AlignRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={onMergeCenter} className={ribBtn} title="Merge & Center">
                  <Merge className="h-4 w-4" />
                </button>
                <button type="button" onClick={onWrapText} className={`${ribBtn} px-2 text-xs`} title="Wrap Text">
                  Wrap Text
                </button>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Number</div>
              <div className="flex items-center gap-0.5 flex-wrap">
                <select
                  className="h-7 min-w-[100px] text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2"
                  onChange={(e) => onNumberFormat(e.target.value)}
                  defaultValue="normal"
                  title="Number format"
                >
                  <option value="normal">General</option>
                  <option value="number">Number</option>
                  <option value="currency">₹ Currency</option>
                  <option value="percent">Percentage</option>
                  <option value="date">Date</option>
                </select>
                <button type="button" className={ribBtn} title="Percent style" onClick={() => onNumberFormat('percent')}>
                  %
                </button>
                <button type="button" onClick={onIncreaseDecimal} className={ribBtn} title="Increase decimal">
                  <Plus className="h-3 w-3" />
                  <span className="text-[10px] ml-0.5">.0</span>
                </button>
                <button type="button" onClick={onDecreaseDecimal} className={ribBtn} title="Decrease decimal">
                  <Minus className="h-3 w-3" />
                  <span className="text-[10px] ml-0.5">.0</span>
                </button>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Styles</div>
              <div className="flex items-center gap-0.5">
                <button type="button" className={`${ribBtn} px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600`}>
                  Conditional Formatting
                </button>
                <button type="button" className={`${ribBtn} px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600`}>
                  Format as Table
                </button>
                <button type="button" className={`${ribBtn} px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600`}>
                  Cell Styles
                </button>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Editing</div>
              <div className="flex items-center gap-0.5">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => onAutoSum ? (autoSumOpen ? setAutoSumOpen(false) : setAutoSumOpen(true)) : undefined}
                    className={`${ribBtn} flex items-center gap-0.5 px-2`}
                    title="AutoSum"
                  >
                    <Sigma className="h-4 w-4 font-bold" />
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {autoSumOpen && onAutoSum && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setAutoSumOpen(false)} />
                      <div className="absolute left-0 top-full mt-0.5 z-20 w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onAutoSum('sum'); setAutoSumOpen(false) }}>Sum</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onAutoSum('average'); setAutoSumOpen(false) }}>Average</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onAutoSum('count'); setAutoSumOpen(false) }}>Count Numbers</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onAutoSum('max'); setAutoSumOpen(false) }}>Max</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onAutoSum('min'); setAutoSumOpen(false) }}>Min</button>
                      </div>
                    </>
                  )}
                </div>
                <button type="button" onClick={onFind} className={ribBtn} title="Find (Ctrl+F)">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'insert' && (
          <>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Tables</div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={onPivot} className={`${ribBtn} px-2 text-xs`} title="Pivot Table">
                  PivotTable
                </button>
                <button type="button" className={`${ribBtn} px-2 text-xs`}>Table</button>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Charts</div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={onChart} className={ribBtn} title="Insert Chart">
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'formulas' && (
          <>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Function Library</div>
              <div className="flex items-center gap-0.5 flex-wrap">
                <button type="button" onClick={onInsertFunction} className={`${ribBtn} px-2 text-xs flex items-center gap-1`} title="Insert Function">
                  <span className="font-mono text-sm">fx</span> Insert Function
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => onAutoSum && (autoSumOpen ? setAutoSumOpen(false) : setAutoSumOpen(true))}
                    className={`${ribBtn} flex items-center gap-0.5 px-2`}
                    title="AutoSum"
                  >
                    <Sigma className="h-4 w-4 font-bold" />
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {autoSumOpen && onAutoSum && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setAutoSumOpen(false)} />
                      <div className="absolute left-0 top-full mt-0.5 z-20 w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onAutoSum('sum'); setAutoSumOpen(false) }}>Sum</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onAutoSum('average'); setAutoSumOpen(false) }}>Average</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onAutoSum('count'); setAutoSumOpen(false) }}>Count Numbers</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onAutoSum('max'); setAutoSumOpen(false) }}>Max</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onAutoSum('min'); setAutoSumOpen(false) }}>Min</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'data' && (
          <>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Sort & Filter</div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={onSortAz} className={ribBtn} title="Sort A to Z">A-Z</button>
                <button type="button" onClick={onSortZa} className={ribBtn} title="Sort Z to A">Z-A</button>
                <button type="button" onClick={onFilter} className={`${ribBtn} ${filterActive ? 'bg-purple-100 dark:bg-purple-900/30' : ''}`} title="Filter">
                  <Filter className="h-4 w-4" />
                </button>
                {filterActive && (
                  <button type="button" onClick={onFilterClear} className="px-2 py-1 text-xs rounded border border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                    Clear filter
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
