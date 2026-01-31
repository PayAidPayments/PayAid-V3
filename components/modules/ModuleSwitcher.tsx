'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  LayoutGrid, 
  ExternalLink,
  Home,
  Users,
  Briefcase,
  Landmark,
  Megaphone,
  UserCircle,
  FolderKanban,
  Package,
  Bot,
  MessageSquare,
  Lightbulb,
  Globe,
  Palette,
  BookOpen,
  Phone,
  BarChart3,
  ShoppingCart,
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
  TrendingUp,
  PackageSearch,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import { getSSOToken, navigateToModule, getModuleUrl } from '@/lib/sso/token-manager'
import { useAuthStore } from '@/lib/stores/auth'
import { modules as moduleConfigs } from '@/lib/modules.config'

// Icon mapping for modules
const moduleIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'home': Home,
  'crm': Users,
  'sales': ShoppingCart,
  'finance': Landmark,
  'marketing': Megaphone,
  'hr': UserCircle,
  'projects': FolderKanban,
  'inventory': Package,
  'analytics': BarChart3,
  'ai-cofounder': Sparkles,
  'ai-chat': MessageSquare,
  'ai-insights': Lightbulb,
  'website-builder': Globe,
  'logo-generator': Palette,
  'knowledge-rag': BookOpen,
  'voice-agents': Phone,
  'communication': MessageSquare,
  'industry-intelligence': Newspaper,
  'appointments': Calendar,
  'workflow': GitBranch,
  'help-center': BookOpen,
  'contracts': FileText,
  'spreadsheet': Table,
  'docs': FileEdit,
  'drive': Folder,
  'slides': Presentation,
  'meet': Video,
  'pdf': FileText,
  'restaurant': UtensilsCrossed,
  'retail': Store,
  'service': Wrench,
  'ecommerce': ShoppingBag,
  'manufacturing': Factory,
  'field-service': Wrench,
  'asset-management': Package,
  'compliance': ShieldCheck,
  'lms': GraduationCap,
  'professional-services': BriefcaseBusiness,
  'healthcare': Heart,
  'education': GraduationCap,
  'real-estate': Home,
  'logistics': Truck,
  'agriculture': Sprout,
  'construction': Hammer,
  'beauty': Scissors,
  'automotive': Car,
  'hospitality': Building2,
  'legal': Scale,
  'financial-services': TrendingUp,
  'events': Calendar,
  'wholesale': PackageSearch,
}

interface Module {
  id: string
  name: string
  icon: string
  iconComponent?: React.ComponentType<{ className?: string }>
  url: string
  active: boolean
  licensed: boolean
}

export function ModuleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const { tenant } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [currentModule, setCurrentModule] = useState<string>('')

  // Detect current module from pathname
  useEffect(() => {
    if (!pathname) {
      setCurrentModule('dashboard')
      return
    }

    // Check all modules from config
    for (const moduleConfig of moduleConfigs) {
      const moduleId = moduleConfig.id
      const moduleUrl = moduleConfig.url
      
      // Check if pathname matches module URL patterns
      if (
        pathname.startsWith(moduleUrl) ||
        pathname.includes(`/${moduleId}/`) ||
        pathname.includes(`/${moduleId}`) ||
        (moduleUrl.includes('/dashboard/') && pathname.startsWith(moduleUrl.replace('/dashboard', '')))
      ) {
        setCurrentModule(moduleId)
        return
      }
    }

    // Fallback checks for common patterns
    if (pathname.startsWith('/dashboard/crm') || pathname.startsWith('/crm')) {
      setCurrentModule('crm')
    } else if (pathname.startsWith('/dashboard/finance') || pathname.startsWith('/finance')) {
      setCurrentModule('finance')
    } else if (pathname.startsWith('/dashboard/sales') || pathname.startsWith('/sales')) {
      setCurrentModule('sales')
    } else if (pathname.startsWith('/dashboard/marketing') || pathname.startsWith('/marketing')) {
      setCurrentModule('marketing')
    } else if (pathname.startsWith('/dashboard/hr') || pathname.startsWith('/hr')) {
      setCurrentModule('hr')
    } else if (pathname.startsWith('/dashboard/projects') || pathname.startsWith('/projects')) {
      setCurrentModule('projects')
    } else if (pathname.startsWith('/dashboard/inventory') || pathname.startsWith('/inventory')) {
      setCurrentModule('inventory')
    } else if (pathname.startsWith('/dashboard/analytics') || pathname.startsWith('/analytics')) {
      setCurrentModule('analytics')
    } else if (pathname.startsWith('/home')) {
      setCurrentModule('home')
    } else {
      setCurrentModule('dashboard')
    }
  }, [pathname])

  // Get available modules based on licenses
  const licensedModules = tenant?.licensedModules || []
  const tenantId = tenant?.id && typeof tenant.id === 'string' ? tenant.id : undefined
  
  // Build modules list from config, filtering by status
  const allModules: Module[] = [
    // Add Home module first
    { 
      id: 'home', 
      name: 'Home', 
      icon: 'home', 
      iconComponent: moduleIconMap['home'], 
      url: tenantId ? `/home/${tenantId}` : '/home', 
      active: currentModule === 'home', 
      licensed: true 
    },
    // Add all other modules from config
    ...moduleConfigs
      .filter(config => config.status === 'active' || config.status === 'beta') // Include active and beta modules
      .map(config => ({
        id: config.id,
        name: config.name,
        icon: config.icon,
        iconComponent: moduleIconMap[config.id] || moduleIconMap[config.icon.toLowerCase()] || Users,
        url: config.url,
        active: currentModule === config.id,
        licensed: licensedModules.includes(config.id) || licensedModules.length === 0 || true, // Show all if no license check or if licensed
        category: config.category, // Store category for sorting
      }))
      .sort((a, b) => {
        // Sort by category (core, productivity, ai, industry), then alphabetically
        const categoryOrder: Record<string, number> = { 'core': 0, 'productivity': 1, 'ai': 2, 'industry': 3 }
        const orderA = categoryOrder[(a as any).category] || 99
        const orderB = categoryOrder[(b as any).category] || 99
        
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name)
      })
  ]

  const availableModules = allModules.filter(m => m.licensed)
  const currentModuleData = allModules.find(m => m.id === currentModule)

  const handleModuleSwitch = (module: Module) => {
    if (module.id === currentModule) {
      setIsOpen(false)
      return
    }

    // If it's the dashboard, use regular navigation
    if (module.id === 'dashboard') {
      router.push(module.url)
      setIsOpen(false)
      return
    }

    // For CRM and other modules, always use base URL (e.g., /crm)
    // The entry point will handle redirecting to tenant-specific route
    // This ensures auth state is properly checked before redirecting
    // Using base URL prevents middleware from blocking due to missing cookie token
    
    // Sync token to cookie before navigating (for middleware access)
    const currentState = useAuthStore.getState()
    if (currentState.token && typeof window !== 'undefined') {
      const expires = new Date()
      expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
      const isSecure = window.location.protocol === 'https:'
      document.cookie = `token=${currentState.token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
    }
    
    router.push(module.url)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        {currentModuleData ? (
          <>
            {currentModuleData.iconComponent ? (
              <currentModuleData.iconComponent className="h-4 w-4" strokeWidth={2} />
            ) : (
              <span className="text-lg">{currentModuleData.icon}</span>
            )}
            <span>{currentModuleData.name}</span>
          </>
        ) : (
          <span>Modules</span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 z-20 min-w-[280px] max-w-[320px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-2 overflow-y-auto max-h-[80vh]">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase sticky top-0 bg-white dark:bg-gray-800 z-10">
                Switch Module ({availableModules.length})
              </div>
              <div className="space-y-1">
                {availableModules.map((module) => {
                  const moduleConfig = moduleConfigs.find(m => m.id === module.id)
                  return (
                    <button
                      key={module.id}
                      onClick={() => handleModuleSwitch(module)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                        module.active
                          ? 'bg-purple-500/10 text-purple-500 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      title={moduleConfig?.description}
                    >
                      {module.iconComponent ? (
                        <module.iconComponent className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
                      ) : (
                        <span className="text-lg">{module.icon}</span>
                      )}
                      <span className="flex-1 text-left truncate">{module.name}</span>
                      {module.active && (
                        <span className="text-xs text-purple-500 flex-shrink-0">●</span>
                      )}
                      {module.url.startsWith('http') && (
                        <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

