'use client'

import { useEffect, useState } from 'react'
import { PlansModulesTable } from '@/components/super-admin/plans/PlansModulesTable'
import { EditPlanModal } from '@/components/super-admin/plans/EditPlanModal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

type PlanRow = {
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

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = () => {
    setLoading(true)
    fetch('/api/super-admin/plans')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setPlans(j.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const [editingPlan, setEditingPlan] = useState<PlanRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleEdit = (plan: PlanRow) => {
    setEditingPlan(plan)
    setIsModalOpen(true)
  }

  const handleCreateNew = () => {
    setEditingPlan(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingPlan(null)
  }

  const handleDuplicate = async (plan: PlanRow) => {
    try {
      const response = await fetch('/api/super-admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${plan.name} (Copy)`,
          description: plan.description,
          tier: plan.tier,
          monthlyPrice: plan.monthlyPrice,
          annualPrice: plan.annualPrice,
          modules: plan.modules,
          maxUsers: plan.maxUsers,
          maxStorage: plan.maxStorage,
        }),
      })

      if (response.ok) {
        fetchPlans()
      }
    } catch (error) {
      console.error('Failed to duplicate plan:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plans & Modules</h1>
          <p className="text-muted-foreground">Single source of truth for entitlements</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>
      <PlansModulesTable
        plans={plans}
        loading={loading}
        onRefresh={fetchPlans}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
      />
      <EditPlanModal
        plan={editingPlan}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={fetchPlans}
      />
    </div>
  )
}
