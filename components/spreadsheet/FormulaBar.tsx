'use client'

interface FormulaBarProps {
  value: string
  onChange: (value: string) => void
  onCommit?: () => void
  onCancel?: () => void
  disabled?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function FormulaBar({ value, onChange, onCommit, onCancel, disabled, inputRef }: FormulaBarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-2 shrink-0">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">fx</span>
      <input
        ref={inputRef}
        type="text"
        className="flex-1 min-w-0 bg-transparent text-sm outline-none border-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCommit?.()
          if (e.key === 'Escape') onCancel?.()
        }}
        placeholder="Enter value or formula"
        disabled={disabled}
      />
    </div>
  )
}
