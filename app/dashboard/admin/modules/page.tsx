'use client'

import { useState, useEffect } from 'react'
import { usePayAidAuth } from '@/lib/hooks/use-payaid-auth'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Icon mapping for modules
const MODULE_ICONS: Record<string, string> = {
  crm: '👥',
  sales: '🛒',
  marketing: '📢',
  finance: '💰',
  hr: '👔',
  communication: '💬',
  'ai-studio': '✨',
  analytics: '📈',
  invoicing: '🧾',
  accounting: '📊',
  whatsapp: '💬',
  // Advanced Features
  projects: '📁',
  workflows: '⚙️',
  contracts: '📝',
  productivity: '💼',
  'field-service': '🔧',
  inventory: '📦',
  assets: '🏢',
  manufacturing: '🏭',
  fssai: '🛡️',
  ondc: '🛍️',
  'help-center': '❓',
}

interface ModuleDefinition {
  moduleId: string
  displayName: string
  description: string
  icon?: string
  starterPrice: number
  professionalPrice: number
  enterprisePrice?: number | null
  features: string[]
  isActive: boolean
}

export default function AdminModulesPage() {
  const { tenant, licensedModules, subscriptionTier, hasModule } = usePayAidAuth()
  const { token } = useAuthStore()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [modules, setModules] = useState<ModuleDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch modules from API
  useEffect(() => {
    async function fetchModules() {
      try {
        const response = await fetch('/api/modules')
        if (!response.ok) {
          throw new Error('Failed to fetch modules')
        }
        const data = await response.json()
        setModules(data.modules || [])
      } catch (err) {
        console.error('Error fetching modules:', err)
        setError(err instanceof Error ? err.message : 'Failed to load modules')
      } finally {
        setIsLoading(false)
      }
    }
    fetchModules()
  }, [])

  const handleToggleModule = async (moduleId: string) => {
    if (!tenant?.id || !token) return

    setIsUpdating(moduleId)
    try {
      const isCurrentlyLicensed = hasModule(moduleId)
      const newModules = isCurrentlyLicensed
        ? licensedModules.filter((id) => id !== moduleId)
        : [...licensedModules, moduleId]

      const response = await fetch(`/api/admin/tenants/${tenant.id}/modules`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          licensedModules: newModules,
        }),
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          const text = await response.text()
          if (text) {
            errorData = JSON.parse(text)
          }
        } catch (parseError) {
          // If response is not valid JSON, use status text
          errorData = { error: response.statusText || 'Unknown error' }
        }
        
        // Use detailed error message if available, otherwise use generic one
        const errorMessage = errorData.message || errorData.error || `Failed to update module license (${response.status})`
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
        })
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Module updated successfully:', result)

      // Show success message
      alert(
        `Module ${isCurrentlyLicensed ? 'deactivated' : 'activated'} successfully! ` +
        `Please log out and log back in to refresh your access token.`
      )

      // Refresh page to update auth state (though token won't update until logout/login)
      window.location.reload()
    } catch (error) {
      console.error('Error updating module:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update module license. Please try again.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsUpdating(null)
    }
  }

  // Only allow admin/owner to access
  const { user } = useAuthStore()
  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need admin or owner permissions to manage modules.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Get icon for module
  const getModuleIcon = (moduleId: string, dbIcon?: string) => {
    if (dbIcon) {
      // Try to use database icon if available
      return dbIcon
    }
    return MODULE_ICONS[moduleId] || '📦'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Loading modules...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Module Management</h1>
        <p className="mt-2 text-gray-600">
          Manage module licenses for <strong>{tenant?.name}</strong>
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Current Plan: <span className="font-medium capitalize">{subscriptionTier}</span>
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Tenant ID: {tenant?.id} | This page is tenant-specific
        </p>
      </div>

      {/* Current Licenses */}
      <Card>
        <CardHeader>
          <CardTitle>Licensed Modules</CardTitle>
          <CardDescription>
            {licensedModules.length} of {modules.length} modules licensed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {licensedModules.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No modules licensed</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {licensedModules.map((moduleId) => {
                const moduleData = modules.find((m) => m.moduleId === moduleId)
                return moduleData ? (
                  <span
                    key={moduleId}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    <span>{getModuleIcon(moduleId, moduleData.icon)}</span>
                    {moduleData.displayName}
                  </span>
                ) : (
                  <span
                    key={moduleId}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                  >
                    {moduleId}
                  </span>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules
          .filter((module) => {
            // Filter out deprecated modules
            const deprecatedModules = ['invoicing', 'accounting']
            return !deprecatedModules.includes(module.moduleId)
          })
          .map((module) => {
          const isLicensed = hasModule(module.moduleId)
          const isUpdatingThis = isUpdating === module.moduleId
          const isLegacy = ['whatsapp'].includes(module.moduleId)

          return (
            <Card 
              key={module.moduleId} 
              className={isLicensed ? 'border-green-500' : isLegacy ? 'border-yellow-300 bg-yellow-50/30' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getModuleIcon(module.moduleId, module.icon)}</span>
                    <div>
                      <CardTitle className="text-lg">
                        {module.displayName}
                        {isLegacy && (
                          <span className="ml-2 text-xs text-yellow-600">(Legacy)</span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                  {isLicensed && (
                    <span className="text-xs bg-green-100 px-2 py-1 rounded" style={{ color: '#53328A' }}>
                      Licensed
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <div>Starter: ₹{module.starterPrice}/mo</div>
                    <div>Professional: ₹{module.professionalPrice}/mo</div>
                    {module.enterprisePrice && (
                      <div>Enterprise: ₹{module.enterprisePrice}/mo</div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleToggleModule(module.moduleId)}
                    disabled={isUpdatingThis}
                    variant={isLicensed ? 'outline' : 'default'}
                    className="w-full"
                  >
                    {isUpdatingThis
                      ? 'Updating...'
                      : isLicensed
                      ? 'Remove License'
                      : 'Activate License'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Note */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is an admin panel for testing. In production, module
            licenses will be managed through the App Store and payment system (Phase 3).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
