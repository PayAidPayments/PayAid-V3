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
  LayoutGrid,
  FileText,
  MessageSquarePlus,
  Lock,
  Unlock,
  Grid3X3,
  PanelTopClose,
  ZoomIn,
  ZoomOut,
  HelpCircle,
} from 'lucide-react'

const tabBtn =
  'px-4 py-2 text-sm font-medium rounded-t border-b-2 border-transparent -mb-px hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors'
const tabBtnActive =
  'px-4 py-2 text-sm font-medium rounded-t border-b-2 border-purple-500 -mb-px bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
const ribBtn =
  'p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50'
const ribGroupLabel = 'text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1'
const ribGroup = 'flex flex-col border-r border-slate-200 dark:border-slate-600 pr-4 last:border-r-0'

export type RibbonTab = 'file' | 'home' | 'insert' | 'pageLayout' | 'formulas' | 'data' | 'review' | 'view' | 'help'

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
  onCut?: () => void
  onCopy?: () => void
  onPaste?: () => void
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  fontFamily?: string
  fontSize?: number
  onFontFamily?: (font: string) => void
  onFontSize?: (size: number) => void
  // Page Layout
  pageMargins?: 'normal' | 'wide' | 'narrow'
  onPageMargins?: (m: 'normal' | 'wide' | 'narrow') => void
  pageOrientation?: 'portrait' | 'landscape'
  onPageOrientation?: (o: 'portrait' | 'landscape') => void
  showGridlines?: boolean
  showHeadings?: boolean
  onToggleGridlines?: () => void
  onToggleHeadings?: () => void
  // Review
  sheetProtected?: boolean
  onProtectSheet?: () => void
  onNewComment?: () => void
  // View
  showFormulaBar?: boolean
  showStatusBar?: boolean
  onToggleFormulaBar?: () => void
  onToggleStatusBar?: () => void
  zoom?: number
  onZoomChange?: (zoom: number) => void
  freezePanes?: 'none' | 'topRow' | 'firstCol' | 'both'
  onFreezePanes?: (freeze: 'none' | 'topRow' | 'firstCol' | 'both') => void
  // Phase 2: Home
  onFillColor?: (color: string) => void
  onFontColor?: (color: string) => void
  fillColor?: string
  fontColor?: string
  onBorders?: (border: 'none' | 'all' | 'outside' | 'bottom') => void
  onConditionalFormatting?: () => void
  onFormatAsTable?: () => void
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
  onCut,
  onCopy,
  onPaste,
  isBold = false,
  isItalic = false,
  isUnderline = false,
  fontFamily = 'Calibri',
  fontSize = 11,
  onFontFamily,
  onFontSize,
  pageMargins = 'normal',
  onPageMargins,
  pageOrientation = 'portrait',
  onPageOrientation,
  showGridlines = true,
  showHeadings = true,
  onToggleGridlines,
  onToggleHeadings,
  sheetProtected = false,
  onProtectSheet,
  onNewComment,
  showFormulaBar = true,
  showStatusBar = true,
  onToggleFormulaBar,
  onToggleStatusBar,
  zoom = 100,
  onZoomChange,
  freezePanes = 'none',
  onFreezePanes,
  onFillColor,
  onFontColor,
  fillColor = '#ffffff',
  fontColor = '#0a0a0a',
  onBorders,
  onConditionalFormatting,
  onFormatAsTable,
}: SpreadsheetRibbonProps) {
  const [autoSumOpen, setAutoSumOpen] = useState(false)
  const [bordersOpen, setBordersOpen] = useState(false)
  const [cfOpen, setCfOpen] = useState(false)
  const [freezeOpen, setFreezeOpen] = useState(false)
  const [fillPickerOpen, setFillPickerOpen] = useState(false)
  const [fontColorPickerOpen, setFontColorPickerOpen] = useState(false)
  const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48]
  const FONTS = ['Calibri', 'Arial', 'Roboto', 'Times New Roman', 'Helvetica']
  const COLOR_SWATCHES = ['#ffffff', '#fef08a', '#86efac', '#93c5fd', '#fda4af', '#e9d5ff', '#fcd34d', '#67e8f9', '#0a0a0a', '#ef4444', '#22c55e', '#3b82f6', '#8b5cf6']
  const ZOOM_OPTIONS = [50, 75, 100, 125, 150, 200]

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
            {(
              [
                ['file', 'File'],
                ['home', 'Home'],
                ['insert', 'Insert'],
                ['pageLayout', 'Page Layout'],
                ['formulas', 'Formulas'],
                ['data', 'Data'],
                ['review', 'Review'],
                ['view', 'View'],
                ['help', 'Help'],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={activeTab === tab ? tabBtnActive : tabBtn}
              >
                {label}
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
      <div className="px-3 py-2.5 flex flex-wrap items-end gap-x-6 gap-y-3 min-h-[72px]">
        {activeTab === 'file' && (
          <div className={ribGroup}>
            <div className={ribGroupLabel}>File</div>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={onSave} disabled={isSaving} className={ribBtn} title="Save">Save</button>
              <div className="relative" ref={saveMenuRef}>
                <button type="button" onClick={onSaveMenuToggle} className={ribBtn} title="Download">Download</button>
                {saveMenuOpen && (
                  <div className="absolute left-0 top-full mt-1 z-30 w-52 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
                    <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onSaveAsCsv}>Save as CSV</button>
                    <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onSaveAsXlsx}>Save as Excel (.xlsx)</button>
                    <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onSaveAsXls}>Save as Excel 97-2003 (.xls)</button>
                  </div>
                )}
              </div>
              <button type="button" onClick={onShare} className={ribBtn} title="Share">Share</button>
            </div>
          </div>
        )}
        {activeTab === 'home' && (
          <>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Clipboard</div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={onCut} className={ribBtn} title="Cut (Ctrl+X)">
                  <Scissors className="h-4 w-4" />
                </button>
                <button type="button" onClick={onCopy} className={ribBtn} title="Copy (Ctrl+C)">
                  <Copy className="h-4 w-4" />
                </button>
                <button type="button" onClick={onPaste} className={ribBtn} title="Paste (Ctrl+V)">
                  <ClipboardPaste className="h-4 w-4" />
                </button>
                <button type="button" className={ribBtn} title="Format Painter (coming soon)" disabled>
                  <Paintbrush className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Font</div>
              <div className="flex items-center gap-0.5 flex-wrap">
                <select
                  className="h-7 min-w-[90px] text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2"
                  title="Font"
                  value={fontFamily}
                  onChange={(e) => onFontFamily?.(e.target.value)}
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <select
                  className="h-7 w-12 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1"
                  title="Font size"
                  value={fontSize}
                  onChange={(e) => onFontSize?.(Number(e.target.value))}
                >
                  {FONT_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button type="button" onClick={onBold} className={`${ribBtn} ${isBold ? 'bg-slate-300 dark:bg-slate-600' : ''}`} title="Bold (Ctrl+B)">
                  <Bold className="h-4 w-4 font-bold" />
                </button>
                <button type="button" onClick={onItalic} className={`${ribBtn} ${isItalic ? 'bg-slate-300 dark:bg-slate-600' : ''}`} title="Italic">
                  <Italic className="h-4 w-4 italic" />
                </button>
                <button type="button" onClick={onUnderline} className={`${ribBtn} ${isUnderline ? 'bg-slate-300 dark:bg-slate-600' : ''}`} title="Underline">
                  <Underline className="h-4 w-4" />
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setFillPickerOpen((v) => !v); setFontColorPickerOpen(false) }}
                    className={ribBtn}
                    title="Fill color"
                  >
                    <span className="w-4 h-4 block border border-slate-400 rounded" style={{ backgroundColor: fillColor }} />
                  </button>
                  {fillPickerOpen && onFillColor && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setFillPickerOpen(false)} />
                      <div className="absolute left-0 top-full mt-0.5 z-20 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
                        <div className="grid grid-cols-4 gap-0.5">
                          {COLOR_SWATCHES.map((c) => (
                            <button key={c} type="button" className="w-6 h-6 rounded border border-slate-300 hover:ring-2 ring-purple-500" style={{ backgroundColor: c }} onClick={() => { onFillColor(c); setFillPickerOpen(false) }} title={c} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setFontColorPickerOpen((v) => !v); setFillPickerOpen(false) }}
                    className={ribBtn}
                    title="Font color"
                  >
                    <Type className="h-4 w-4" style={{ color: fontColor }} />
                  </button>
                  {fontColorPickerOpen && onFontColor && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setFontColorPickerOpen(false)} />
                      <div className="absolute left-0 top-full mt-0.5 z-20 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
                        <div className="grid grid-cols-4 gap-0.5">
                          {COLOR_SWATCHES.map((c) => (
                            <button key={c} type="button" className="w-6 h-6 rounded border border-slate-300 hover:ring-2 ring-purple-500 flex items-center justify-center text-xs" style={{ backgroundColor: c, color: c === '#0a0a0a' || c === '#8b5cf6' ? '#fff' : '#000' }} onClick={() => { onFontColor(c); setFontColorPickerOpen(false) }} title={c}>A</button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
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
              <div className="flex items-center gap-0.5 flex-wrap">
                <div className="relative">
                  <button type="button" onClick={() => { setBordersOpen((v) => !v); setCfOpen(false) }} className={`${ribBtn} px-2 py-1 text-xs flex items-center gap-0.5`} title="Borders">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Borders</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {bordersOpen && onBorders && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setBordersOpen(false)} />
                      <div className="absolute left-0 top-full mt-0.5 z-20 w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onBorders('none'); setBordersOpen(false) }}>No Border</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onBorders('all'); setBordersOpen(false) }}>All Borders</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onBorders('outside'); setBordersOpen(false) }}>Outside Borders</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onBorders('bottom'); setBordersOpen(false) }}>Bottom Border</button>
                      </div>
                    </>
                  )}
                </div>
                <div className="relative">
                  <button type="button" onClick={() => { setCfOpen((v) => !v); setBordersOpen(false) }} className={`${ribBtn} px-2 py-1 text-xs`} title="Conditional Formatting">
                    Conditional Formatting
                    <ChevronDown className="h-3 w-3 inline ml-0.5" />
                  </button>
                  {cfOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setCfOpen(false)} />
                      <div className="absolute left-0 top-full mt-0.5 z-20 w-52 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onConditionalFormatting?.(); setCfOpen(false) }}>Highlight Cell Rules...</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setCfOpen(false) }>Top/Bottom Rules...</button>
                        <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setCfOpen(false)}>Clear Rules</button>
                      </div>
                    </>
                  )}
                </div>
                <button type="button" onClick={onFormatAsTable} className={`${ribBtn} px-2 py-1 text-xs`} title="Format as Table">
                  Format as Table
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
                <button type="button" className={`${ribBtn} px-2 text-xs`} disabled>Table</button>
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

        {activeTab === 'pageLayout' && (
          <>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Page Setup</div>
              <div className="flex items-center gap-0.5 flex-wrap">
                <select
                  className="h-7 min-w-[90px] text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2"
                  value={pageMargins}
                  onChange={(e) => onPageMargins?.(e.target.value as 'normal' | 'wide' | 'narrow')}
                  title="Margins"
                >
                  <option value="normal">Normal</option>
                  <option value="wide">Wide</option>
                  <option value="narrow">Narrow</option>
                </select>
                <select
                  className="h-7 min-w-[100px] text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2"
                  value={pageOrientation}
                  onChange={(e) => onPageOrientation?.(e.target.value as 'portrait' | 'landscape')}
                  title="Orientation"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Sheet Options</div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={onToggleGridlines} className={`${ribBtn} px-2 text-xs flex items-center gap-1 ${showGridlines ? 'bg-slate-200 dark:bg-slate-600' : ''}`} title="Gridlines">
                  <Grid3X3 className="h-3.5 w-3.5" /> Gridlines
                </button>
                <button type="button" onClick={onToggleHeadings} className={`${ribBtn} px-2 text-xs flex items-center gap-1 ${showHeadings ? 'bg-slate-200 dark:bg-slate-600' : ''}`} title="Headings">
                  <PanelTopClose className="h-3.5 w-3.5" /> Headings
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

        {activeTab === 'review' && (
          <>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Comments</div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={onNewComment} className={`${ribBtn} px-2 text-xs flex items-center gap-1`} title="New Comment">
                  <MessageSquarePlus className="h-3.5 w-3.5" /> New Comment
                </button>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Changes</div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={onProtectSheet}
                  className={`${ribBtn} px-2 text-xs flex items-center gap-1 ${sheetProtected ? 'bg-amber-100 dark:bg-amber-900/30' : ''}`}
                  title={sheetProtected ? 'Unprotect Sheet' : 'Protect Sheet'}
                >
                  {sheetProtected ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {sheetProtected ? 'Unprotect Sheet' : 'Protect Sheet'}
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'view' && (
          <>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Show</div>
              <div className="flex items-center gap-0.5 flex-wrap">
                <button type="button" onClick={onToggleFormulaBar} className={`${ribBtn} px-2 text-xs ${showFormulaBar ? 'bg-slate-200 dark:bg-slate-600' : ''}`} title="Formula Bar">Formula Bar</button>
                <button type="button" onClick={onToggleStatusBar} className={`${ribBtn} px-2 text-xs ${showStatusBar ? 'bg-slate-200 dark:bg-slate-600' : ''}`} title="Status Bar">Status Bar</button>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Zoom</div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={() => onZoomChange?.(Math.max(50, zoom - 25))} className={ribBtn} title="Zoom Out"><ZoomOut className="h-4 w-4" /></button>
                <select className="h-7 w-14 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-1" value={zoom} onChange={(e) => onZoomChange?.(Number(e.target.value))} title="Zoom">
                  {ZOOM_OPTIONS.map((z) => <option key={z} value={z}>{z}%</option>)}
                </select>
                <button type="button" onClick={() => onZoomChange?.(Math.min(200, zoom + 25))} className={ribBtn} title="Zoom In"><ZoomIn className="h-4 w-4" /></button>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Window</div>
              <div className="relative">
                <button type="button" onClick={() => setFreezeOpen((v) => !v)} className={`${ribBtn} px-2 text-xs flex items-center gap-1`} title="Freeze Panes"><PanelTopClose className="h-3.5 w-3.5" /> Freeze Panes <ChevronDown className="h-3 w-3" /></button>
                {freezeOpen && onFreezePanes && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFreezeOpen(false)} />
                    <div className="absolute left-0 top-full mt-0.5 z-20 w-44 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
                      <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onFreezePanes('none'); setFreezeOpen(false) }}>Unfreeze</button>
                      <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onFreezePanes('topRow'); setFreezeOpen(false) }}>Freeze Top Row</button>
                      <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onFreezePanes('firstCol'); setFreezeOpen(false) }}>Freeze First Column</button>
                      <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => { onFreezePanes('both'); setFreezeOpen(false) }}>Freeze Panes</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'help' && (
          <>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Help</div>
              <div className="flex items-center gap-0.5">
                <a href="/docs" target="_blank" rel="noopener noreferrer" className={`${ribBtn} px-2 text-xs flex items-center gap-1`} title="Documentation">
                  <HelpCircle className="h-3.5 w-3.5" /> Documentation
                </a>
                <a href="https://payaid.in/support" target="_blank" rel="noopener noreferrer" className={`${ribBtn} px-2 text-xs flex items-center gap-1`} title="Support">
                  <FileText className="h-3.5 w-3.5" /> Support
                </a>
              </div>
            </div>
            <div className={ribGroup}>
              <div className={ribGroupLabel}>Keyboard shortcuts</div>
              <div className="text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5 max-w-[200px]">
                <div>Ctrl+Z / Ctrl+Y — Undo / Redo</div>
                <div>Ctrl+C / X / V — Copy / Cut / Paste</div>
                <div>Ctrl+F — Find & Replace</div>
                <div>Arrow keys — Move selection</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
