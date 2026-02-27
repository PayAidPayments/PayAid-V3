'use client'

function formatNumber(n: number): string {
  if (Number.isNaN(n) || !Number.isFinite(n)) return '0'
  if (n % 1 === 0) return String(n)
  return n.toFixed(2)
}

function formatINR(n: number): string {
  if (Number.isNaN(n) || !Number.isFinite(n)) return '₹0'
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })
}

interface StatusBarProps {
  sum: number
  count: number
  avg: number
  hasSelection: boolean
}

export function StatusBar({ sum, count, avg, hasSelection }: StatusBarProps) {
  if (!hasSelection) {
    return (
      <div className="h-8 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 flex items-center justify-end text-xs text-slate-500 dark:text-slate-400 shrink-0" />
    )
  }
  return (
    <div className="h-8 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 flex items-center justify-end gap-6 text-xs text-slate-600 dark:text-slate-400 shrink-0">
      <span>Sum: {formatINR(sum)}</span>
      <span>Count: {count}</span>
      <span>Average: {formatINR(avg)}</span>
    </div>
  )
}
