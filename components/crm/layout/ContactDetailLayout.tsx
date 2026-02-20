import React from 'react'

interface ContactDetailLayoutProps {
  title: string
  subtitle?: string
  tags?: React.ReactNode
  primaryActions?: React.ReactNode
  leftColumn: React.ReactNode
  centerColumn: React.ReactNode
  rightColumn: React.ReactNode
}

export const ContactDetailLayout: React.FC<ContactDetailLayoutProps> = ({
  title,
  subtitle,
  tags,
  primaryActions,
  leftColumn,
  centerColumn,
  rightColumn,
}) => (
  <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
    <div className="max-w-[1920px] mx-auto px-6 py-6">
      {/* Header */}
      <header className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{subtitle}</p>
          )}
          {tags && <div className="mt-3 flex flex-wrap gap-2">{tags}</div>}
        </div>
        <div className="flex items-center gap-3 ml-4">
          {primaryActions}
        </div>
      </header>

      {/* 3-column main layout */}
      <div className="grid grid-cols-[minmax(0,1.3fr),minmax(0,2fr),minmax(0,1.2fr)] gap-5">
        {/* Left Column */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
          {leftColumn}
        </section>

        {/* Center Column - Activity Timeline */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden">
          {centerColumn}
        </section>

        {/* Right Column - AI & Actions */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 space-y-4">
          {rightColumn}
        </section>
      </div>
    </div>
  </div>
)
