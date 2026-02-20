'use client'

import { usePayAidAuth } from '@/lib/hooks/use-payaid-auth'
import { useAuthStore } from '@/lib/stores/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

interface ModuleGateProps {
  module: string
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * ModuleGate Component
 * 
 * CRITICAL: Redirects to app-store/modules page when module is not licensed
 * if module is not licensed. Does NOT show locked badges - completely hides content.
 * 
 * @example
 * ```tsx
 * <ModuleGate module="crm">
 *   <ContactsPage />
 * </ModuleGate>
 * ```
 */
export function ModuleGate({
  module,
  children,
  fallback,
  redirectTo,
}: ModuleGateProps) {
  const { hasModule, licensedModules, subscriptionTier } = usePayAidAuth()
  const { user, tenant } = useAuthStore()
  const router = useRouter()

  // Determine redirect destination
  const defaultRedirect = tenant?.id 
    ? `/home/${tenant.id}`  // Redirect to tenant home
    : '/home'   // Fallback to home

  const redirectPath = redirectTo || defaultRedirect

  // CRITICAL: If module not licensed, redirect immediately (no locked badges shown)
  useEffect(() => {
    if (!hasModule(module)) {
      router.push(redirectPath)
    }
  }, [module, hasModule, redirectPath, router])

  // If module is licensed, render children
  if (hasModule(module)) {
    return <>{children}</>
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>
  }

  // Default upgrade prompt (shown briefly before redirect)
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🔒</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Module Not Licensed
        </h2>
        
        <p className="text-gray-600 mb-6">
          You don't have access to the <strong>{getModuleName(module)}</strong> module.
          {licensedModules.length > 0 && (
            <span className="block mt-2 text-sm">
              Your current modules: {licensedModules.map(getModuleName).join(', ')}
            </span>
          )}
        </p>

        <div className="space-y-3">
          <Link
            href={redirectPath}
            className="inline-block w-full px-6 py-3 bg-[#F5C700] text-[#53328A] rounded-lg font-medium hover:bg-[#E0B200] transition-colors text-center"
          >
            Add Modules
          </Link>
          
          <Link
            href={tenant?.id ? `/home/${tenant.id}` : '/home'}
            className="inline-block w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>

        {subscriptionTier === 'free' && (
          <p className="mt-6 text-sm text-gray-500">
            Visit Module Management to activate modules
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Helper to get human-readable module name
 */
function getModuleName(moduleId: string): string {
  const moduleNames: Record<string, string> = {
    crm: 'CRM',
    invoicing: 'Invoicing',
    accounting: 'Accounting',
    hr: 'HR & Payroll',
    whatsapp: 'WhatsApp',
    analytics: 'Analytics',
  }
  return moduleNames[moduleId] || moduleId.toUpperCase()
}
