'use client'

/**
 * Phase 2: Module Navigation Section
 * A collapsible section that can be added to existing sidebars
 * Shows enabled modules with quick access
 */

import React, { useState } from 'react'
import { useModule } from '@/contexts/ModuleContext'
import { ModuleNavigation } from './ModuleNavigation'
import { ChevronDown, ChevronUp, Grid3x3 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function ModuleNavigationSection({ 
  defaultOpen = false,
  className 
}: { 
  defaultOpen?: boolean
  className?: string 
}) {
  const { enabledModules, isLoading } = useModule()
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (isLoading || enabledModules.length === 0) {
    return null
  }

  return (
    <div className={cn('border-b border-gray-200 dark:border-gray-700', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Grid3x3 className="h-4 w-4" />
          <span>Modules</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({enabledModules.length})
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-2 py-2">
          <ModuleNavigation />
        </div>
      )}
    </div>
  )
}
