'use client'

/**
 * Phase 2: Module Toggle Component
 * Enable/disable modules for a tenant
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ModuleToggleProps {
  tenantId: string
  moduleId: string
  enabled: boolean
}

export function ModuleToggle({ tenantId, moduleId, enabled: initialEnabled }: ModuleToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async (newValue: boolean) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/modules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId,
          enabled: newValue,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update module')
      }

      setEnabled(newValue)
      router.refresh() // Refresh to show updated state
    } catch (error) {
      console.error('Failed to toggle module:', error)
      // Revert on error
      setEnabled(!newValue)
      alert(error instanceof Error ? error.message : 'Failed to update module')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <label className="text-sm font-medium">Enable Module</label>
        <p className="text-xs text-muted-foreground">
          {enabled ? 'Module is active' : 'Module is disabled'}
        </p>
      </div>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={loading}
        />
      )}
    </div>
  )
}
