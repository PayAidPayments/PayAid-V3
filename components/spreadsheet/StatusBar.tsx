'use client'

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

/** Excel-like status bar: Sum, Count, Average on the bottom-right. */
export function StatusBar({ sum, count, avg, hasSelection }: StatusBarProps) {
  return (
    <div
      className="h-8 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 px-4 flex items-center justify-end gap-6 text-xs text-slate-700 dark:text-slate-300 shrink-0 font-medium"
      role="status"
      aria-label={`Sum ${formatINR(sum)}, Count ${count}, Average ${formatINR(avg)}`}
    >
      {hasSelection ? (
        <>
          <span className="tabular-nums">Sum: {formatINR(sum)}</span>
          <span className="tabular-nums">Count: {count}</span>
          <span className="tabular-nums">Average: {formatINR(avg)}</span>
        </>
      ) : (
        <span className="text-slate-500 dark:text-slate-400">Ready</span>
      )}
    </div>
  )
}
