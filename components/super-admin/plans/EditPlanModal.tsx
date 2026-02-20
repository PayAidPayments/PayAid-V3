'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { X } from 'lucide-react'

interface PlanRow {
  id: string
  name: string
  description: string | null
  tier: string
  monthlyPrice: number
  annualPrice: number | null
  modules: string[]
  maxUsers: number | null
  maxStorage: number | null
  isActive: boolean
  isSystem: boolean
}

interface EditPlanModalProps {
  plan: PlanRow | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const AVAILABLE_MODULES = [
  'crm',
  'finance',
  'marketing',
  'hr',
  'projects',
  'ai-cofounder',
  'whatsapp',
  'analytics',
  'inventory',
  'retail',
]

export function EditPlanModal({ plan, isOpen, onClose, onSave }: EditPlanModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<{
    name: string
    description: string
    tier: string
    monthlyPrice: number
    annualPrice: number | null
    modules: string[]
    maxUsers: number | null
    maxStorage: number | null
    isActive: boolean
  }>({
    name: '',
    description: '',
    tier: '',
    monthlyPrice: 0,
    annualPrice: null,
    modules: [],
    maxUsers: null,
    maxStorage: null,
    isActive: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        tier: plan.tier,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice ?? null,
        modules: plan.modules || [],
        maxUsers: plan.maxUsers,
        maxStorage: plan.maxStorage,
        isActive: plan.isActive,
      })
    }
  }, [plan])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = plan?.id
        ? `/api/super-admin/plans/${plan.id}`
        : '/api/super-admin/plans'
      const method = plan?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          annualPrice: formData.annualPrice || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save plan')
      }

      toast({
        title: 'Success',
        description: `Plan ${plan?.id ? 'updated' : 'created'} successfully`,
      })

      onSave()
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save plan',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (module: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter((m) => m !== module)
        : [...prev.modules, module],
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {plan?.id ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Plan Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tier</label>
              <Input
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Price (₹)</label>
              <Input
                type="number"
                value={formData.monthlyPrice}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Annual Price (₹)</label>
              <Input
                type="number"
                value={formData.annualPrice || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    annualPrice: parseFloat(e.target.value) || null,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Users</label>
              <Input
                type="number"
                value={formData.maxUsers || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxUsers: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Max Storage (MB)</label>
            <Input
              type="number"
              value={formData.maxStorage || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxStorage: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Modules</label>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_MODULES.map((module) => (
                <label
                  key={module}
                  className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.modules.includes(module)}
                    onChange={() => toggleModule(module)}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{module}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : plan?.id ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
