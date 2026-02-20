'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { X } from 'lucide-react'

interface FeatureFlag {
  id: string
  featureName: string
  isEnabled: boolean
  tenantId: string | null
  settings?: {
    rolloutPercentage?: number
    targetingPlans?: string[]
    targetingTenants?: string[]
  } | null
}

interface EditFeatureFlagModalProps {
  flag: FeatureFlag | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function EditFeatureFlagModal({
  flag,
  isOpen,
  onClose,
  onSave,
}: EditFeatureFlagModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    featureName: '',
    isEnabled: false,
    rolloutPercentage: 100,
    targetingPlans: [] as string[],
    targetingTenants: [] as string[],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (flag) {
      const settings = (flag.settings || {}) as { rolloutPercentage?: number; targetingPlans?: string[]; targetingTenants?: string[] }
      setFormData({
        featureName: flag.featureName,
        isEnabled: flag.isEnabled,
        rolloutPercentage: settings.rolloutPercentage ?? (flag.isEnabled ? 100 : 0),
        targetingPlans: Array.isArray(settings.targetingPlans) ? settings.targetingPlans : [],
        targetingTenants: Array.isArray(settings.targetingTenants) ? settings.targetingTenants : (flag.tenantId ? [flag.tenantId] : []),
      })
    }
  }, [flag])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = flag?.id
        ? `/api/super-admin/feature-flags/${flag.id}`
        : '/api/super-admin/feature-flags'
      const method = flag?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureName: formData.featureName,
          tenantId: flag?.tenantId || null,
          isEnabled: formData.isEnabled && formData.rolloutPercentage > 0,
          settings: {
            rolloutPercentage: formData.rolloutPercentage,
            targetingPlans: formData.targetingPlans,
            targetingTenants: formData.targetingTenants,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save feature flag')
      }

      toast({
        title: 'Success',
        description: `Feature flag ${flag?.id ? 'updated' : 'created'} successfully`,
      })

      onSave()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save feature flag',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {flag?.id ? 'Edit Feature Flag' : 'Create Feature Flag'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Flag Key</label>
            <Input
              value={formData.featureName}
              onChange={(e) => setFormData({ ...formData, featureName: e.target.value })}
              required
              placeholder="e.g., new-dashboard"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  checked={!formData.isEnabled}
                  onChange={() => setFormData({ ...formData, isEnabled: false, rolloutPercentage: 0 })}
                />
                <span>Off</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  checked={formData.isEnabled && formData.rolloutPercentage < 100}
                  onChange={() => setFormData({ ...formData, isEnabled: true, rolloutPercentage: 20 })}
                />
                <span>Beta (Rollout)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  checked={formData.isEnabled && formData.rolloutPercentage === 100}
                  onChange={() => setFormData({ ...formData, isEnabled: true, rolloutPercentage: 100 })}
                />
                <span>On</span>
              </label>
            </div>
          </div>

          {formData.isEnabled && formData.rolloutPercentage < 100 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Rollout Percentage: {formData.rolloutPercentage}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={formData.rolloutPercentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rolloutPercentage: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Advanced targeting</label>
            <div className="space-y-3">
              {flag?.tenantId && (
                <p className="text-sm text-muted-foreground">
                  Tenant-specific flag for: {flag.tenantId.slice(0, 8)}…
                </p>
              )}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Target by plans (comma-separated)
                </label>
                <Input
                  value={formData.targetingPlans.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetingPlans: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. free, pro, enterprise"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Target by tenant IDs (comma-separated)
                </label>
                <Input
                  value={formData.targetingTenants.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetingTenants: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. clxx… clyy…"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for all tenants (or use plans above)
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : flag?.id ? 'Update Flag' : 'Create Flag'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
