import React from 'react'

interface KPIItem {
  label: string
  value: string | number
  helper?: string
}

interface KPIBarProps {
  items: KPIItem[]
}

export const KPIBar: React.FC<KPIBarProps> = ({ items }) => (
  <div className="grid grid-cols-4 gap-3">
    {items.map((item, index) => (
      <div
        key={index}
        className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 px-4 py-3 shadow-sm flex flex-col"
      >
        <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
          {item.label}
        </span>
        <span className="text-xl font-semibold text-slate-900 dark:text-gray-100 mt-1">
          {item.value}
        </span>
        {item.helper && (
          <span className="text-xs text-slate-500 dark:text-gray-400 mt-1">{item.helper}</span>
        )}
      </div>
    ))}
  </div>
)
