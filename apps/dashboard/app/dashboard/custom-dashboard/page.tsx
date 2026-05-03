'use client'

import { CustomDashboardBuilder } from '@/components/dashboard/CustomDashboardBuilder'
import { useParams } from 'next/navigation'

export default function CustomDashboardPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  const handleSave = async (dashboard: { name: string; widgets: any[] }) => {
    try {
      const response = await fetch('/api/dashboards/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dashboard),
      })

      if (!response.ok) throw new Error('Failed to save dashboard')

      alert('Dashboard saved successfully!')
    } catch (error) {
      console.error('Error saving dashboard:', error)
      alert('Failed to save dashboard')
    }
  }

  return (
    <div className="container mx-auto p-6">
      <CustomDashboardBuilder tenantId={tenantId} onSave={handleSave} />
    </div>
  )
}
