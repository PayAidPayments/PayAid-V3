'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { ChevronDown, Home, Briefcase, DollarSign, ShoppingCart, Users, BarChart3, FolderKanban, Package, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Module {
  id: string
  name: string
  url: string
  icon: React.ComponentType<{ className?: string }> | ((props: { className?: string }) => React.ReactElement)
  description: string
}

// Rupee symbol component
const RupeeIcon = ({ className }: { className?: string }) => (
  <span className={className} style={{ fontSize: '1rem', fontWeight: 'bold' }}>₹</span>
)

// Module configuration for decoupled architecture
// Each module is a separate Next.js app on its own subdomain
const modules: Module[] = [
  {
    id: 'crm',
    name: 'CRM',
    url: '/crm', // Will be crm.payaid.in in production
    icon: Users,
    description: 'Customer relationships'
  },
  {
    id: 'projects',
    name: 'Projects',
    url: '/projects', // Will be projects.payaid.in in production
    icon: FolderKanban,
    description: 'Project management'
  },
  {
    id: 'sales',
    name: 'Sales',
    url: '/sales', // Will be sales.payaid.in in production
    icon: ShoppingCart,
    description: 'Landing pages & orders'
  },
  {
    id: 'inventory',
    name: 'Inventory',
    url: '/inventory', // Will be inventory.payaid.in in production
    icon: Package,
    description: 'Products & stock'
  },
  {
    id: 'finance',
    name: 'Finance',
    url: '/finance', // Will be finance.payaid.in in production
    icon: RupeeIcon,
    description: 'Invoices & accounting'
  },
  {
    id: 'marketing',
    name: 'Marketing',
    url: '/marketing',
    icon: BarChart3,
    description: 'Campaigns & email'
  },
  {
    id: 'hr',
    name: 'HR',
    url: '/hr',
    icon: Briefcase,
    description: 'Employees & payroll'
  },
  {
    id: 'industry-intelligence',
    name: 'Industry Intelligence',
    url: '/industry-intelligence',
    icon: TrendingUp,
    description: 'News & market trends'
  },
]

export function ModuleSwitcher({ currentModule }: { currentModule?: string }) {
  const [open, setOpen] = useState(false)
  const { tenant } = useAuthStore()
  const router = useRouter()
  const tenantId = tenant?.id

  const currentModuleData = modules.find(m => m.id === currentModule)
  const otherModules = modules.filter(m => m.id !== currentModule)

  const handleModuleSwitch = async (module: Module) => {
    // Get SSO token from current session
    const token = useAuthStore.getState().token
    
    // Build URL with tenant ID if available
    let targetUrl = module.url
    if (tenantId) {
      // For module-specific routes (crm, sales, finance)
      targetUrl = `${module.url}/${tenantId}/Home/`
    }
    
    // In decoupled architecture with subdomains, use OAuth2 flow
    // Check if target is a different subdomain
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : ''
    const targetHost = new URL(targetUrl, window.location.origin).hostname
    
    if (currentHost !== targetHost && targetHost.includes('.')) {
      // Cross-subdomain navigation - use OAuth2 flow
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const authUrl = new URL('/api/oauth/authorize', apiUrl)
      authUrl.searchParams.set('client_id', 'payaid-client')
      authUrl.searchParams.set('redirect_uri', `${targetUrl}?sso=true`)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('state', encodeURIComponent(targetUrl))
      
      // Redirect to OAuth authorization
      window.location.href = authUrl.toString()
    } else {
      // Same domain - use cookie-based SSO (token already in cookie)
      // Store token in sessionStorage as fallback
      if (token && typeof window !== 'undefined') {
        sessionStorage.setItem('sso_token', token)
      }
      
      router.push(targetUrl)
    }
    
    setOpen(false)
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
            <currentModuleData.icon className="w-4 h-4" />
            <span>{currentModuleData.name}</span>
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
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
            Switch Module
          </div>
          {otherModules.map((module) => {
            const Icon = module.icon
            return (
              <button
                key={module.id}
                onClick={() => handleModuleSwitch(module)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {module.id === 'finance' ? (
                  <RupeeIcon className="w-4 h-4 text-gray-500" />
                ) : (
                  <Icon className="w-4 h-4 text-gray-500" />
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{module.name}</span>
                  <span className="text-xs text-gray-500">{module.description}</span>
                </div>
              </button>
            )
          })}
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => {
              router.push('/home')
              setOpen(false)
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-gray-500" />
            <div className="flex flex-col">
              <span className="font-medium">Back to Apps</span>
              <span className="text-xs text-gray-500">View all modules</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

