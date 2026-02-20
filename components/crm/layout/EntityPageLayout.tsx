import React from 'react'

interface EntityPageLayoutProps {
  title: string
  subtitle?: string
  kpiBar?: React.ReactNode
  leftSidebar?: React.ReactNode
  mainContent: React.ReactNode
  rightSidebar?: React.ReactNode
}

export const EntityPageLayout: React.FC<EntityPageLayoutProps> = ({
  title,
  subtitle,
  kpiBar,
  leftSidebar,
  mainContent,
  rightSidebar,
}) => (
  <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
    <div className="max-w-[1920px] mx-auto px-6 py-6">
      {/* Page header */}
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{subtitle}</p>
        )}
      </header>

      {kpiBar && (
        <section className="mb-4">
          {kpiBar}
        </section>
      )}

      {/* 3-column layout */}
      <div className="grid grid-cols-[260px,minmax(0,1fr),320px] gap-6">
        {/* Left sidebar */}
        <aside className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm h-fit sticky top-4">
          {leftSidebar}
        </aside>

        {/* Main content */}
        <main className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {mainContent}
        </main>

        {/* Right sidebar (AI) */}
        {rightSidebar ? (
          <aside className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm h-fit sticky top-4">
            {rightSidebar}
          </aside>
        ) : (
          <div className="hidden" />
        )}
      </div>
    </div>
  </div>
)
