'use client'

/**
 * Phase 2: Module Switcher Component
 * Allows users to switch between enabled modules
 */

import React, { useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useModule } from '@/contexts/ModuleContext'
import { useAuthStore } from '@/lib/stores/auth'
import { modules as moduleConfigs } from '@/lib/modules.config'
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
  X,
  Home,
  ShoppingCart,
  Megaphone,
  Landmark,
  UserCircle,
  FolderKanban,
  Package,
  Bot,
  Lightbulb,
  Globe,
  Palette,
  BookOpen,
  Phone,
  Calendar,
  GitBranch,
  Newspaper,
  FileText,
  Table,
  FileEdit,
  Folder,
  Presentation,
  Video,
  UtensilsCrossed,
  Store,
  Wrench,
  ShoppingBag,
  Factory,
  BriefcaseBusiness,
  Heart,
  GraduationCap,
  Truck,
  Sprout,
  Hammer,
  Scissors,
  Car,
  Building2,
  Scale,
  PackageSearch,
  ShieldCheck,
  Sparkles
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
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  UserCog,
  DollarSign,
  MessageSquare,
  BarChart3,
  CreditCard,
  Workflow,
  TrendingUp,
  Home,
  ShoppingCart,
  Megaphone,
  Landmark,
  UserCircle,
  FolderKanban,
  Package,
  Bot,
  Lightbulb,
  Globe,
  Palette,
  BookOpen,
  Phone,
  Calendar,
  GitBranch,
  Newspaper,
  FileText,
  Table,
  FileEdit,
  Folder,
  Presentation,
  Video,
  UtensilsCrossed,
  Store,
  Wrench,
  ShoppingBag,
  Factory,
  BriefcaseBusiness,
  Heart,
  GraduationCap,
  Truck,
  Sprout,
  Hammer,
  Scissors,
  Car,
  Building2,
  Scale,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  IndianRupee: Landmark,
  Briefcase: FolderKanban,
}

export function ModuleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const { enabledModules: registryModules, currentModule: contextModule, setCurrentModule, isLoading } = useModule()
  const { tenant } = useAuthStore()
  const [open, setOpen] = useState(false)

  // Combine modules from registry and config
  const allAvailableModules = useMemo(() => {
    const modules: Array<{
      id: string
      name: string
      description: string
      icon: string
      url: string
      iconComponent?: React.ComponentType<{ className?: string }>
    }> = []

    // Add Home module
    modules.push({
      id: 'home',
      name: 'Home',
      description: 'Central hub for all modules',
      icon: 'Home',
      url: tenant?.id ? `/home/${tenant.id}` : '/home',
      iconComponent: Home,
    })

    // Add all active modules from config
    for (const config of moduleConfigs) {
      if (config.status === 'active' || config.status === 'beta') {
        // Map icon names to components
        const iconName = config.icon
        const iconComponent = iconMap[iconName] || iconMap[config.id] || Users
        
        modules.push({
          id: config.id,
          name: config.name,
          description: config.description,
          icon: config.icon,
          url: config.url,
          iconComponent,
        })
      }
    }

    // Sort by category then name
    const categoryOrder: Record<string, number> = { 'core': 0, 'productivity': 1, 'ai': 2, 'industry': 3 }
    modules.sort((a, b) => {
      if (a.id === 'home') return -1
      if (b.id === 'home') return 1
      const configA = moduleConfigs.find(m => m.id === a.id)
      const configB = moduleConfigs.find(m => m.id === b.id)
      const orderA = configA ? categoryOrder[configA.category] || 99 : 99
      const orderB = configB ? categoryOrder[configB.category] || 99 : 99
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })

    return modules
  }, [tenant])

  // Detect current module from pathname
  const currentModule = useMemo(() => {
    if (!pathname) return contextModule || null
    
    for (const module of allAvailableModules) {
      if (
        pathname.startsWith(module.url) ||
        pathname.includes(`/${module.id}/`) ||
        pathname.includes(`/${module.id}`)
      ) {
        return module.id
      }
    }
    
    return contextModule || null
  }, [pathname, contextModule, allAvailableModules])

  const handleModuleSelect = (moduleId: string) => {
    const module = allAvailableModules.find(m => m.id === moduleId)
    if (module) {
      setCurrentModule(moduleId)
      router.push(module.url)
      setOpen(false)
    }
  }

  // Don't render if loading
  if (isLoading) {
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
        
        <div className="mt-6 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="px-1 text-xs font-semibold text-muted-foreground uppercase mb-2">
            All Modules ({allAvailableModules.length})
          </div>
          {allAvailableModules.map((module) => {
            const IconComponent = module.iconComponent || iconMap[module.icon] || Users
            const isActive = currentModule === module.id

            return (
              <button
                key={module.id}
                onClick={() => handleModuleSelect(module.id)}
                className={cn(
                  'w-full flex items-center gap-4 rounded-lg border p-4 text-left transition-all hover:border-primary hover:bg-accent',
                  isActive && 'border-primary bg-accent'
                )}
              >
                <div className={cn(
                  'rounded-lg p-3 flex-shrink-0',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{module.name}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {module.description}
                  </div>
                </div>
                {isActive && (
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
