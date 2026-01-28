'use client'

/**
 * Phase 2: Module Switcher Component
 * Allows users to switch between enabled modules
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useModule } from '@/contexts/ModuleContext'
import { 
  Users, 
  UserCog, 
  DollarSign, 
  MessageSquare, 
  BarChart3, 
  CreditCard, 
  Workflow, 
  TrendingUp,
  Grid3x3,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils/cn'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  UserCog,
  DollarSign,
  MessageSquare,
  BarChart3,
  CreditCard,
  Workflow,
  TrendingUp,
}

export function ModuleSwitcher() {
  const router = useRouter()
  const { enabledModules, currentModule, setCurrentModule, isLoading } = useModule()
  const [open, setOpen] = useState(false)

  const handleModuleSelect = (moduleId: string) => {
    const module = enabledModules.find(m => m.id === moduleId)
    if (module && module.routes.length > 0) {
      setCurrentModule(moduleId)
      router.push(module.routes[0].path)
      setOpen(false)
    }
  }

  // Don't render if loading or no modules
  if (isLoading || enabledModules.length === 0) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Grid3x3 className="h-4 w-4" />
          <span className="hidden sm:inline">Modules</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>Switch Module</SheetTitle>
          <SheetDescription>
            Select a module to navigate to
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 grid gap-3">
          {enabledModules.map((module) => {
            const IconComponent = iconMap[module.icon] || Users
            const isActive = currentModule === module.id

            return (
              <button
                key={module.id}
                onClick={() => handleModuleSelect(module.id)}
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary hover:bg-accent',
                  isActive && 'border-primary bg-accent'
                )}
              >
                <div className={cn(
                  'rounded-lg p-3',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{module.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {module.description}
                  </div>
                </div>
                {isActive && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
