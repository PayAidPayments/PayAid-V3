'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronDown, LayoutGrid, ExternalLink } from 'lucide-react'
import { getSSOToken, navigateToModule, getModuleUrl } from '@/lib/sso/token-manager'
import { useAuthStore } from '@/lib/stores/auth'

interface Module {
  id: string
  name: string
  icon: string
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
  
  const allModules: Module[] = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊', url: '/dashboard', active: currentModule === 'dashboard', licensed: true },
    { id: 'crm', name: 'CRM', icon: '👥', url: getModuleUrl('crm'), active: currentModule === 'crm', licensed: licensedModules.includes('crm') || true },
    { id: 'sales', name: 'Sales', icon: '💼', url: getModuleUrl('sales'), active: currentModule === 'sales', licensed: licensedModules.includes('sales') || true },
    { id: 'finance', name: 'Finance', icon: '💰', url: getModuleUrl('finance'), active: currentModule === 'finance', licensed: licensedModules.includes('finance') || true },
    { id: 'marketing', name: 'Marketing', icon: '📢', url: getModuleUrl('marketing'), active: currentModule === 'marketing', licensed: licensedModules.includes('marketing') || true },
    { id: 'hr', name: 'HR', icon: '👔', url: getModuleUrl('hr'), active: currentModule === 'hr', licensed: licensedModules.includes('hr') || true },
    { id: 'projects', name: 'Projects', icon: '📋', url: getModuleUrl('projects'), active: currentModule === 'projects', licensed: licensedModules.includes('projects') || true },
    { id: 'inventory', name: 'Inventory', icon: '📦', url: getModuleUrl('inventory'), active: currentModule === 'inventory', licensed: licensedModules.includes('inventory') || true },
    { id: 'ai-cofounder', name: 'AI Co-founder', icon: '🤖', url: getModuleUrl('ai-cofounder'), active: currentModule === 'ai-cofounder', licensed: licensedModules.includes('ai-cofounder') || true },
    { id: 'ai-chat', name: 'AI Chat', icon: '💬', url: getModuleUrl('ai-chat'), active: currentModule === 'ai-chat', licensed: licensedModules.includes('ai-chat') || true },
    { id: 'ai-insights', name: 'AI Insights', icon: '💡', url: getModuleUrl('ai-insights'), active: currentModule === 'ai-insights', licensed: licensedModules.includes('ai-insights') || true },
    { id: 'website-builder', name: 'Website Builder', icon: '🌐', url: getModuleUrl('website-builder'), active: currentModule === 'website-builder', licensed: licensedModules.includes('website-builder') || true },
    { id: 'logo-generator', name: 'Logo Generator', icon: '🎨', url: getModuleUrl('logo-generator'), active: currentModule === 'logo-generator', licensed: licensedModules.includes('logo-generator') || true },
    { id: 'knowledge-rag', name: 'Knowledge & RAG AI', icon: '📚', url: getModuleUrl('knowledge-rag'), active: currentModule === 'knowledge-rag', licensed: licensedModules.includes('knowledge-rag') || true },
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

    // For other modules, use SSO navigation
    const ssoToken = getSSOToken()
    if (ssoToken) {
      navigateToModule(module.id, ssoToken)
    } else {
      // Fallback to regular navigation if no SSO token
      router.push(module.url)
    }
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
            <span>{currentModuleData.icon}</span>
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      module.active
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg">{module.icon}</span>
                    <span className="flex-1 text-left">{module.name}</span>
                    {module.active && (
                      <span className="text-xs text-purple-600 dark:text-purple-400">●</span>
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

