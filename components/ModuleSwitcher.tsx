'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import {
  ChevronDown,
  Home,
  Briefcase,
  ShoppingCart,
  Users,
  FolderKanban,
  Package,
  Megaphone,
  Sparkles,
  LayoutGrid,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  getPrimaryModules,
  getSecondaryModulesByGroup,
  getSecondaryGroupLabel,
  getModuleHomeUrl,
  type PayAidModuleConfig,
} from '@/lib/config/payaid-modules.config'
import { isModuleListedForTenantLicense } from '@/lib/tenant/module-license-filter'

const RupeeIcon = ({ className }: { className?: string }) => (
  <span className={className} style={{ fontSize: '1rem', fontWeight: 'bold' }}>₹</span>
)

const iconMap: Record<string, LucideIcon | typeof RupeeIcon> = {
  Home,
  Users,
  UserCog: Briefcase,
  ShoppingCart,
  Megaphone,
  IndianRupee: RupeeIcon as unknown as LucideIcon,
  FolderKanban,
  Package,
  Sparkles,
  BarChart3: Megaphone,
  MessageSquare: Megaphone,
  Lightbulb: Megaphone,
  Globe: Megaphone,
  Palette: Megaphone,
  BookOpen: Megaphone,
  Phone: Megaphone,
  LayoutGrid,
  Table: Megaphone,
  FileEdit: Megaphone,
  Folder: Megaphone,
  Video: Megaphone,
  FileText: Megaphone,
  Presentation: Megaphone,
  TrendingUp: Megaphone,
  GitBranch: Megaphone,
  ShieldCheck: Megaphone,
  GraduationCap: Megaphone,
  Calendar: Megaphone,
  Headphones: Megaphone,
  Bell,
  Settings,
}

function getIcon(iconName: string) {
  return iconMap[iconName] ?? Home
}

export function ModuleSwitcher({ currentModule }: { currentModule?: string }) {
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const { tenant } = useAuthStore()
  const router = useRouter()
  const tenantId = tenant?.id

  const primaryModules = getPrimaryModules()
  const secondaryByGroupRaw = getSecondaryModulesByGroup()
  const licensedModules = tenant?.licensedModules ?? []

  const primaryModulesVisible = useMemo(
    () => primaryModules.filter((m) => isModuleListedForTenantLicense(m.id, tenantId, licensedModules)),
    [tenantId, licensedModules, primaryModules]
  )

  const secondaryByGroup = useMemo(() => {
    if (!tenantId) return secondaryByGroupRaw
    const out = { ...secondaryByGroupRaw }
    for (const k of Object.keys(out) as Array<keyof typeof out>) {
      out[k] = out[k].filter((m) => isModuleListedForTenantLicense(m.id, tenantId, licensedModules))
    }
    return out
  }, [tenantId, licensedModules, secondaryByGroupRaw])

  const currentModuleData = primaryModulesVisible.find((m) => m.id === currentModule)

  const handleModuleSwitch = (mod: PayAidModuleConfig) => {
    const token = useAuthStore.getState().token
    const targetUrl = tenantId ? getModuleHomeUrl(mod.id, tenantId) : mod.basePath
    if (token && typeof window !== 'undefined') {
      sessionStorage.setItem('sso_token', token)
    }
    router.push(targetUrl)
    setOpen(false)
    setMoreOpen(false)
  }

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
      >
        {currentModuleData ? (
          <>
            {currentModuleData.id === 'finance' ? (
              <RupeeIcon className="w-4 h-4" />
            ) : (
              (() => {
                const Icon = getIcon(currentModuleData.icon)
                return <Icon className="w-4 h-4" />
              })()
            )}
            <span>{currentModuleData.label}</span>
          </>
        ) : (
          <>
            <Home className="w-4 h-4" />
            <span>Switch Module</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50 max-h-[80vh] overflow-y-auto">
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">
            Primary
          </div>
          {primaryModulesVisible.map((mod) => {
            const Icon = getIcon(mod.icon)
            return (
              <button
                key={mod.id}
                onClick={() => handleModuleSwitch(mod)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {mod.id === 'finance' ? (
                  <RupeeIcon className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                ) : (
                  <Icon className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                )}
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-slate-100">{mod.label}</span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">{mod.description}</span>
                </div>
              </button>
            )
          })}
          <div className="border-t border-gray-200 dark:border-slate-700 my-2" />
          <div className="px-3 py-1.5">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="w-full flex items-center gap-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span className="font-medium text-gray-900 dark:text-slate-100">More Apps</span>
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <div className="pl-7 pt-1 space-y-3">
                {(['ai', 'communication', 'productivity', 'intelligence', 'operations', 'support'] as const).map(
                  (group) => {
                    const mods = secondaryByGroup[group]
                    if (!mods.length) return null
                    return (
                      <div key={group}>
                        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                          {getSecondaryGroupLabel(group)}
                        </p>
                        <div className="space-y-0.5">
                          {mods.map((mod) => {
                            const Icon = getIcon(mod.icon)
                            return (
                              <button
                                key={mod.id}
                                onClick={() => handleModuleSwitch(mod)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              >
                                <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400 shrink-0" />
                                <span className="text-gray-700 dark:text-slate-300 truncate">{mod.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 dark:border-slate-700 my-2" />
          <button
            onClick={() => {
              router.push(tenantId ? `/home/${tenantId}` : '/home')
              setOpen(false)
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-gray-500 dark:text-slate-400" />
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 dark:text-slate-100">Command Center</span>
              <span className="text-xs text-gray-500 dark:text-slate-400">Cross-module dashboard</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

