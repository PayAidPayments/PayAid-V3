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
  LayoutGrid,
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
import { isModuleListedForTenantLicense } from '@/lib/tenant/module-license-filter'
import { MODULE_SURFACE_OWNERSHIP } from '@/lib/taxonomy/business-os-taxonomy'

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
  LayoutGrid,
  IndianRupee: Landmark,
  Briefcase: FolderKanban,
}

export function ModuleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const { enabledModules: registryModules, currentModule: contextModule, setCurrentModule, isLoading } = useModule()
  const { tenant } = useAuthStore()
  const [open, setOpen] = useState(false)

  const classifySurface = (moduleId: string): 'suite' | 'platform' | 'workspace' | 'ai-feature' | 'feature' => {
    const ownership = MODULE_SURFACE_OWNERSHIP[moduleId]
    if (!ownership) return 'feature'
    if (ownership.surface === 'suite') return 'suite'
    if (ownership.surface === 'platform-capability') return 'platform'
    if (ownership.surface === 'workspace-tool') return 'workspace'
    if (ownership.surface === 'feature' && ownership.suite === 'ai-workspace') return 'ai-feature'
    return 'feature'
  }

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

    // Add all active modules from config, excluding industry modules
    // Industry is selected during signup and cannot be switched
    for (const config of moduleConfigs) {
      if (
        (config.status === 'active' || config.status === 'beta') &&
        config.category !== 'industry' // Exclude industry modules - they're not switchable modules
      ) {
        // Map icon names to components
        const iconName = config.icon
        const iconComponent = iconMap[iconName] || iconMap[config.id] || Users
        // Tenant-scoped URLs where applicable
        let url = config.url
        if (tenant?.id) {
          if (config.id === 'ai-studio') url = `/ai-studio/${tenant.id}/Home`
          else if (config.id === 'productivity') url = `/productivity/${tenant.id}/Home`
        }
        modules.push({
          id: config.id,
          name: config.name,
          description: config.description,
          icon: config.icon,
          url,
          iconComponent,
        })
      }
    }

    // Sort by category then name (excluding industry): Home first, then Core, Productivity, AI
    const categoryOrder: Record<string, number> = { 'core': 0, 'productivity': 1, 'ai': 2 }
    const getCategory = (id: string) => {
      if (id === 'home') return 'home'
      const c = moduleConfigs.find(m => m.id === id)
      return c?.category ?? 'core'
    }
    modules.sort((a, b) => {
      if (a.id === 'home') return -1
      if (b.id === 'home') return 1
      const orderA = categoryOrder[getCategory(a.id)] ?? 99
      const orderB = categoryOrder[getCategory(b.id)] ?? 99
      if (orderA !== orderB) return orderA - orderB
      return a.name.localeCompare(b.name)
    })

    const tenantId = tenant?.id && typeof tenant.id === 'string' ? tenant.id : undefined
    const licensedModules = tenant?.licensedModules ?? []
    return modules.filter((m) => isModuleListedForTenantLicense(m.id, tenantId, licensedModules))
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
        
        <div className="mt-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {(() => {
            const homeModules = allAvailableModules.filter(m => m.id === 'home')
            const suiteModules = allAvailableModules.filter((m) => classifySurface(m.id) === 'suite')
            const platformModules = allAvailableModules.filter((m) => classifySurface(m.id) === 'platform')
            const aiFeatureModules = allAvailableModules.filter((m) => classifySurface(m.id) === 'ai-feature')
            const workspaceModules = allAvailableModules.filter((m) => classifySurface(m.id) === 'workspace')
            const featureModules = allAvailableModules.filter((m) => classifySurface(m.id) === 'feature')
            const sections: { title: string; modules: typeof allAvailableModules }[] = [
              { title: 'Home', modules: homeModules },
              { title: 'Business Suites', modules: suiteModules },
              { title: 'Platform Capabilities', modules: platformModules },
              { title: 'AI Workspace Tools', modules: aiFeatureModules },
              { title: 'Workspace Tools', modules: workspaceModules },
              { title: 'Other Features', modules: featureModules },
            ]
            return sections.map(({ title, modules: sectionModules }) => {
              if (sectionModules.length === 0) return null
              return (
                <div key={title}>
                  <div className="px-1 text-xs font-semibold text-muted-foreground uppercase mb-2">
                    {title} ({sectionModules.length})
                  </div>
                  <div className="space-y-2">
                    {sectionModules.map((module) => {
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
                </div>
              )
            })
          })()}
        </div>
      </SheetContent>
    </Sheet>
  )
}
