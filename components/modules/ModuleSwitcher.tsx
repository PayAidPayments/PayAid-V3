'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown, 
  LayoutGrid, 
  Search,
  Star,
  StarOff,
  Clock,
  X,
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
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { modules as moduleConfigs, ModuleConfig } from '@/lib/modules.config'
import { 
  getModuleTier, 
  getTierDisplayName, 
  getTierDescription,
  organizeModulesByTier,
  ModuleTier,
  TieredModule
} from '@/lib/modules/module-tiers'
import { cn } from '@/lib/utils'

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

// LocalStorage keys
const PINNED_MODULES_KEY = 'payaid_pinned_modules'
const RECENTLY_USED_KEY = 'payaid_recently_used_modules'
const MAX_RECENT_MODULES = 10

// Get pinned modules from localStorage
function getPinnedModules(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const pinned = localStorage.getItem(PINNED_MODULES_KEY)
    return pinned ? JSON.parse(pinned) : []
  } catch {
    return []
  }
}

// Save pinned modules to localStorage
function savePinnedModules(modules: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PINNED_MODULES_KEY, JSON.stringify(modules))
  } catch {
    // Ignore errors
  }
}

// Get recently used modules from localStorage
function getRecentlyUsedModules(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const recent = localStorage.getItem(RECENTLY_USED_KEY)
    return recent ? JSON.parse(recent) : []
  } catch {
    return []
  }
}

// Save recently used module
function saveRecentlyUsedModule(moduleId: string) {
  if (typeof window === 'undefined') return
  try {
    const recent = getRecentlyUsedModules()
    const filtered = recent.filter(id => id !== moduleId)
    const updated = [moduleId, ...filtered].slice(0, MAX_RECENT_MODULES)
    localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updated))
    localStorage.setItem(`module_last_used_${moduleId}`, new Date().toISOString())
  } catch {
    // Ignore errors
  }
}

// Toggle pinned module
function togglePinnedModule(moduleId: string) {
  const pinned = getPinnedModules()
  const isPinned = pinned.includes(moduleId)
  if (isPinned) {
    savePinnedModules(pinned.filter(id => id !== moduleId))
  } else {
    savePinnedModules([...pinned, moduleId])
  }
}

export function ModuleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const { tenant } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [currentModule, setCurrentModule] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pinnedModules, setPinnedModules] = useState<string[]>([])
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([])
  const [expandedTiers, setExpandedTiers] = useState<Set<ModuleTier>>(new Set(['tier1-top6']))
  const [isMobile, setIsMobile] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load pinned and recently used modules
  useEffect(() => {
    setPinnedModules(getPinnedModules())
    setRecentlyUsed(getRecentlyUsedModules())
  }, [])

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

    // Fallback checks
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
    } else if (pathname.startsWith('/home')) {
      setCurrentModule('home')
    } else {
      setCurrentModule('dashboard')
    }
  }, [pathname])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchQuery('')
        return
      }

      // Focus search on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Global keyboard shortcut to open (Ctrl+M or Cmd+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm' && !isOpen) {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Get available modules
  const licensedModules = tenant?.licensedModules || []
  const tenantId = tenant?.id && typeof tenant.id === 'string' ? tenant.id : undefined

  // Build modules list
  const allModules = useMemo(() => {
    const modules: ModuleConfig[] = [
      {
        id: 'home',
        name: 'Home',
        description: 'Central hub for all modules',
        icon: 'Home',
        url: tenantId ? `/home/${tenantId}` : '/home',
        status: 'active',
        category: 'core',
        color: '#53328A'
      },
      ...moduleConfigs.filter(
        config => 
          (config.status === 'active' || config.status === 'beta') && 
          config.category !== 'industry'
      )
    ]

    return modules.filter(m => 
      licensedModules.includes(m.id) || licensedModules.length === 0 || true
    )
  }, [tenantId, licensedModules])

  // Organize modules by tier
  const organizedModules = useMemo(() => {
    // Mock badges - in production, fetch from API
    const badges: Record<string, number> = {}
    
    return organizeModulesByTier(
      allModules,
      pinnedModules,
      recentlyUsed,
      badges
    )
  }, [allModules, pinnedModules, recentlyUsed])

  // Filter modules by search query
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) {
      return organizedModules
    }

    const query = searchQuery.toLowerCase()
    const filtered: Record<ModuleTier, TieredModule[]> = {
      'tier1-top6': [],
      'tier2-operational': [],
      'tier3-ai-intelligence': [],
      'tier4-productivity': [],
      'tier5-specialized': [],
      'tier6-creative': []
    }

    Object.keys(organizedModules).forEach(tier => {
      filtered[tier as ModuleTier] = organizedModules[tier as ModuleTier].filter(module =>
        module.name.toLowerCase().includes(query) ||
        module.description.toLowerCase().includes(query) ||
        module.id.toLowerCase().includes(query)
      )
    })

    return filtered
  }, [organizedModules, searchQuery])

  // Get recently used modules (limited to 5)
  const recentModules = useMemo(() => {
    return recentlyUsed
      .slice(0, 5)
      .map(id => allModules.find(m => m.id === id))
      .filter(Boolean) as ModuleConfig[]
  }, [recentlyUsed, allModules])

  // Get pinned modules
  const pinnedModulesList = useMemo(() => {
    return pinnedModules
      .map(id => allModules.find(m => m.id === id))
      .filter(Boolean) as ModuleConfig[]
  }, [pinnedModules, allModules])

  const currentModuleData = allModules.find(m => m.id === currentModule)

  const handleModuleSwitch = (module: ModuleConfig) => {
    if (module.id === currentModule) {
      setIsOpen(false)
      return
    }

    // Save to recently used
    saveRecentlyUsedModule(module.id)
    setRecentlyUsed(getRecentlyUsedModules())

    // Sync token to cookie before navigating
    const currentState = useAuthStore.getState()
    if (currentState.token && typeof window !== 'undefined') {
      const expires = new Date()
      expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000)
      const isSecure = window.location.protocol === 'https:'
      document.cookie = `token=${currentState.token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
    }

    router.push(module.url)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleTogglePin = (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation()
    togglePinnedModule(moduleId)
    setPinnedModules(getPinnedModules())
  }

  const toggleTier = (tier: ModuleTier) => {
    setExpandedTiers(prev => {
      const next = new Set(prev)
      if (next.has(tier)) {
        next.delete(tier)
      } else {
        next.add(tier)
      }
      return next
    })
  }

  const renderModuleItem = (module: TieredModule) => {
    const Icon = moduleIconMap[module.id] || Users
    const isActive = module.id === currentModule
    const isPinned = pinnedModules.includes(module.id)

    return (
      <button
        key={module.id}
        onClick={() => handleModuleSwitch(module)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group',
          isActive
            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        )}
        title={module.description}
      >
        <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
        <span className="flex-1 text-left truncate">{module.name}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {module.badge && module.badge > 0 && (
            <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-xs">
              {module.badge > 99 ? '99+' : module.badge}
            </Badge>
          )}
          <button
            onClick={(e) => handleTogglePin(e, module.id)}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600',
              isPinned && 'opacity-100'
            )}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            {isPinned ? (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </button>
    )
  }

  const renderTierSection = (tier: ModuleTier, modules: TieredModule[]) => {
    if (modules.length === 0) return null

    const isExpanded = expandedTiers.has(tier)
    const displayName = getTierDisplayName(tier)
    const description = getTierDescription(tier)

    if (isMobile) {
      // Accordion style for mobile
      return (
        <div key={tier} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <button
            onClick={() => toggleTier(tier)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div>
              <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </div>
            </div>
            <ChevronRight
              className={cn(
                'h-5 w-5 text-gray-400 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
          {isExpanded && (
            <div className="px-2 py-2 space-y-1">
              {modules.map(renderModuleItem)}
            </div>
          )}
        </div>
      )
    }

    // Desktop: Always show, no accordion
    return (
      <div key={tier} className="space-y-2">
        <div className="px-3 py-2">
          <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {displayName}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {description}
          </div>
        </div>
        <div className="space-y-1">
          {modules.map(renderModuleItem)}
        </div>
      </div>
    )
  }

  // Desktop: Two-column layout
  const renderDesktopLayout = () => {
    const tier1Modules = filteredModules['tier1-top6']
    const otherTiers = [
      { tier: 'tier2-operational' as ModuleTier, modules: filteredModules['tier2-operational'] },
      { tier: 'tier3-ai-intelligence' as ModuleTier, modules: filteredModules['tier3-ai-intelligence'] },
      { tier: 'tier4-productivity' as ModuleTier, modules: filteredModules['tier4-productivity'] },
      { tier: 'tier5-specialized' as ModuleTier, modules: filteredModules['tier5-specialized'] },
      { tier: 'tier6-creative' as ModuleTier, modules: filteredModules['tier6-creative'] }
    ].filter(item => item.modules.length > 0)

    return (
      <div className="grid grid-cols-2 gap-6 p-4">
        {/* Left Column: Top 6 + Recently Used + Pinned */}
        <div className="space-y-4">
          {/* Top 6 */}
          {tier1Modules.length > 0 && (
            <div className="space-y-2">
              <div className="px-2">
                <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Top 6
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Daily-use business tools
                </div>
              </div>
              <div className="space-y-1">
                {tier1Modules.map(renderModuleItem)}
              </div>
            </div>
          )}

          {/* Pinned */}
          {pinnedModulesList.length > 0 && (
            <div className="space-y-2">
              <div className="px-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pinned
                </div>
              </div>
              <div className="space-y-1">
                {pinnedModulesList.map(module => {
                  const tieredModule: TieredModule = {
                    ...module,
                    tier: getModuleTier(module.id),
                    isPinned: true
                  }
                  return renderModuleItem(tieredModule)
                })}
              </div>
            </div>
          )}

          {/* Recently Used */}
          {recentModules.length > 0 && (
            <div className="space-y-2">
              <div className="px-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recently Used
                </div>
              </div>
              <div className="space-y-1">
                {recentModules.map(module => {
                  const tieredModule: TieredModule = {
                    ...module,
                    tier: getModuleTier(module.id),
                    lastUsed: new Date()
                  }
                  return renderModuleItem(tieredModule)
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Other Tiers */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {otherTiers.map(({ tier, modules }) => renderTierSection(tier, modules))}
        </div>
      </div>
    )
  }

  // Mobile: Accordion layout
  const renderMobileLayout = () => {
    const allTiers: { tier: ModuleTier; modules: TieredModule[] }[] = [
      { tier: 'tier1-top6', modules: filteredModules['tier1-top6'] },
      { tier: 'tier2-operational', modules: filteredModules['tier2-operational'] },
      { tier: 'tier3-ai-intelligence', modules: filteredModules['tier3-ai-intelligence'] },
      { tier: 'tier4-productivity', modules: filteredModules['tier4-productivity'] },
      { tier: 'tier5-specialized', modules: filteredModules['tier5-specialized'] },
      { tier: 'tier6-creative', modules: filteredModules['tier6-creative'] }
    ].filter(item => item.modules.length > 0)

    return (
      <div className="p-2 space-y-0">
        {/* Pinned */}
        {pinnedModulesList.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="px-2 mb-2 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pinned
              </div>
            </div>
            <div className="space-y-1">
              {pinnedModulesList.map(module => {
                const tieredModule: TieredModule = {
                  ...module,
                  tier: getModuleTier(module.id),
                  isPinned: true
                }
                return renderModuleItem(tieredModule)
              })}
            </div>
          </div>
        )}

        {/* Recently Used */}
        {recentModules.length > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="px-2 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div className="font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Recently Used
              </div>
            </div>
            <div className="space-y-1">
              {recentModules.map(module => {
                const tieredModule: TieredModule = {
                  ...module,
                  tier: getModuleTier(module.id),
                  lastUsed: new Date()
                }
                return renderModuleItem(tieredModule)
              })}
            </div>
          </div>
        )}

        {/* All Tiers */}
        {allTiers.map(({ tier, modules }) => renderTierSection(tier, modules))}
      </div>
    )
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
            {moduleIconMap[currentModuleData.id] && (
              <moduleIconMap[currentModuleData.id] className="h-4 w-4" strokeWidth={2} />
            )}
            <span className="hidden sm:inline">{currentModuleData.name}</span>
          </>
        ) : (
          <span className="hidden sm:inline">Modules</span>
        )}
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false)
              setSearchQuery('')
            }}
          />
          <div className="absolute top-full right-0 mt-2 z-50 w-[90vw] sm:w-[700px] max-w-[95vw] max-h-[85vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header with Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search modules... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+M</kbd> to open, <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> to close
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
              {searchQuery ? (
                // Search Results
                <div className="p-4 space-y-4">
                  {Object.entries(filteredModules).map(([tier, modules]) => 
                    modules.length > 0 && renderTierSection(tier as ModuleTier, modules)
                  )}
                  {Object.values(filteredModules).every(modules => modules.length === 0) && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No modules found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              ) : (
                // Normal Layout
                isMobile ? renderMobileLayout() : renderDesktopLayout()
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
