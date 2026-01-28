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
  Phone
} from 'lucide-react'
import { getSSOToken, navigateToModule, getModuleUrl } from '@/lib/sso/token-manager'
import { useAuthStore } from '@/lib/stores/auth'

// Icon mapping for modules
const moduleIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'home': Home,
  'crm': Users,
  'sales': Briefcase,
  'finance': Landmark, // Changed from DollarSign to Landmark (bank/finance icon for Indian Rupee context)
  'marketing': Megaphone,
  'hr': UserCircle,
  'projects': FolderKanban,
  'inventory': Package,
  'ai-cofounder': Bot,
  'ai-chat': MessageSquare,
  'ai-insights': Lightbulb,
  'website-builder': Globe,
  'logo-generator': Palette,
  'knowledge-rag': BookOpen,
  'voice-agents': Phone,
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
    if (pathname?.startsWith('/dashboard/crm') || pathname?.startsWith('/crm')) {
      setCurrentModule('crm')
    } else if (pathname?.startsWith('/dashboard/finance') || pathname?.startsWith('/finance')) {
      setCurrentModule('finance')
    } else if (pathname?.startsWith('/dashboard/sales') || pathname?.startsWith('/sales')) {
      setCurrentModule('sales')
    } else if (pathname?.startsWith('/dashboard/marketing') || pathname?.startsWith('/marketing')) {
      setCurrentModule('marketing')
    } else if (pathname?.startsWith('/dashboard/hr') || pathname?.startsWith('/hr')) {
      setCurrentModule('hr')
    } else if (pathname?.startsWith('/dashboard/projects') || pathname?.startsWith('/projects')) {
      setCurrentModule('projects')
    } else if (pathname?.startsWith('/dashboard/inventory') || pathname?.startsWith('/inventory')) {
      setCurrentModule('inventory')
    } else if (pathname?.startsWith('/ai-cofounder') || pathname?.includes('/Cofounder')) {
      setCurrentModule('ai-cofounder')
    } else if (pathname?.startsWith('/ai-chat') || pathname?.includes('/Chat')) {
      setCurrentModule('ai-chat')
    } else if (pathname?.startsWith('/ai-insights') || pathname?.includes('/Insights')) {
      setCurrentModule('ai-insights')
    } else if (pathname?.startsWith('/website-builder') || pathname?.includes('/Websites')) {
      setCurrentModule('website-builder')
    } else if (pathname?.startsWith('/logo-generator') || pathname?.includes('/Logos')) {
      setCurrentModule('logo-generator')
    } else if (pathname?.startsWith('/knowledge-rag') || pathname?.includes('/Knowledge')) {
      setCurrentModule('knowledge-rag')
    } else if (pathname?.startsWith('/ai-studio')) {
      setCurrentModule('ai-studio')
    } else {
      setCurrentModule('dashboard')
    }
  }, [pathname])

  // Get available modules based on licenses
  const licensedModules = tenant?.licensedModules || []
  const tenantId = tenant?.id && typeof tenant.id === 'string' ? tenant.id : undefined
  
  const allModules: Module[] = [
    { id: 'home', name: 'Home', icon: 'home', iconComponent: moduleIconMap['home'], url: tenantId ? `/home/${tenantId}` : '/home', active: currentModule === 'home', licensed: true },
    { id: 'crm', name: 'CRM', icon: 'crm', iconComponent: moduleIconMap['crm'], url: getModuleUrl('crm', tenantId), active: currentModule === 'crm', licensed: licensedModules.includes('crm') || true },
    { id: 'sales', name: 'Sales', icon: 'sales', iconComponent: moduleIconMap['sales'], url: getModuleUrl('sales', tenantId), active: currentModule === 'sales', licensed: licensedModules.includes('sales') || true },
    { id: 'finance', name: 'Finance', icon: 'finance', iconComponent: moduleIconMap['finance'], url: getModuleUrl('finance', tenantId), active: currentModule === 'finance', licensed: licensedModules.includes('finance') || true },
    { id: 'marketing', name: 'Marketing', icon: 'marketing', iconComponent: moduleIconMap['marketing'], url: getModuleUrl('marketing', tenantId), active: currentModule === 'marketing', licensed: licensedModules.includes('marketing') || true },
    { id: 'hr', name: 'HR', icon: 'hr', iconComponent: moduleIconMap['hr'], url: getModuleUrl('hr', tenantId), active: currentModule === 'hr', licensed: licensedModules.includes('hr') || true },
    { id: 'projects', name: 'Projects', icon: 'projects', iconComponent: moduleIconMap['projects'], url: getModuleUrl('projects', tenantId), active: currentModule === 'projects', licensed: licensedModules.includes('projects') || true },
    { id: 'inventory', name: 'Inventory', icon: 'inventory', iconComponent: moduleIconMap['inventory'], url: getModuleUrl('inventory', tenantId), active: currentModule === 'inventory', licensed: licensedModules.includes('inventory') || true },
    { id: 'ai-cofounder', name: 'AI Co-founder', icon: 'ai-cofounder', iconComponent: moduleIconMap['ai-cofounder'], url: getModuleUrl('ai-cofounder', tenantId), active: currentModule === 'ai-cofounder', licensed: licensedModules.includes('ai-cofounder') || true },
    { id: 'ai-chat', name: 'AI Chat', icon: 'ai-chat', iconComponent: moduleIconMap['ai-chat'], url: getModuleUrl('ai-chat', tenantId), active: currentModule === 'ai-chat', licensed: licensedModules.includes('ai-chat') || true },
    { id: 'ai-insights', name: 'AI Insights', icon: 'ai-insights', iconComponent: moduleIconMap['ai-insights'], url: getModuleUrl('ai-insights', tenantId), active: currentModule === 'ai-insights', licensed: licensedModules.includes('ai-insights') || true },
    { id: 'website-builder', name: 'Website Builder', icon: 'website-builder', iconComponent: moduleIconMap['website-builder'], url: getModuleUrl('website-builder', tenantId), active: currentModule === 'website-builder', licensed: licensedModules.includes('website-builder') || true },
    { id: 'logo-generator', name: 'Logo Generator', icon: 'logo-generator', iconComponent: moduleIconMap['logo-generator'], url: getModuleUrl('logo-generator', tenantId), active: currentModule === 'logo-generator', licensed: licensedModules.includes('logo-generator') || true },
    { id: 'knowledge-rag', name: 'Knowledge & RAG AI', icon: 'knowledge-rag', iconComponent: moduleIconMap['knowledge-rag'], url: getModuleUrl('knowledge-rag', tenantId), active: currentModule === 'knowledge-rag', licensed: licensedModules.includes('knowledge-rag') || true },
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
          <div className="absolute top-full right-0 mt-2 z-20 min-w-[200px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Switch Module
              </div>
              <div className="space-y-1">
                {availableModules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => handleModuleSwitch(module)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                      module.active
                        ? 'bg-teal-primary/10 text-teal-primary'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {module.iconComponent ? (
                      <module.iconComponent className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
                    ) : (
                      <span className="text-lg">{module.icon}</span>
                    )}
                    <span className="flex-1 text-left">{module.name}</span>
                    {module.active && (
                      <span className="text-xs text-teal-primary">●</span>
                    )}
                    {module.url.startsWith('http') && (
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

