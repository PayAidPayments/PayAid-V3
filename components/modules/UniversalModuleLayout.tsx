'use client'

import { ReactNode } from 'react'
import { ModuleTopBar } from './ModuleTopBar'
import { ModuleSwitcher } from './ModuleSwitcher'

interface TopBarItem {
  name: string
  href: string
  icon?: string
}

interface UniversalModuleLayoutProps {
  moduleId: string
  moduleName: string
  topBarItems: TopBarItem[]
  children: ReactNode
  sidebarWidth?: number // Default: 260px (expanded)
}

/**
 * Universal Module Layout Component
 * Standardized structure for all 28 modules:
 * - Global navigation bar (module switcher)
 * - Sidebar navigation (260px expanded)
 * - Hero section with gradient + 4 metric cards
 * - GlassCard content sections
 * - Consistent spacing (32px gaps)
 */
export function UniversalModuleLayout({
  moduleId,
  moduleName,
  topBarItems,
  children,
  sidebarWidth = 260,
}: UniversalModuleLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Module Top Bar */}
        <ModuleTopBar
          moduleId={moduleId}
          moduleName={moduleName}
          items={topBarItems}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
