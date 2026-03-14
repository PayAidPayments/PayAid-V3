'use client'

import { useEffect, useState } from 'react'
import { TenantsTable } from '@/components/super-admin/tenants/TenantsTable'
import { useTenants } from '@/lib/hooks/super-admin/useTenants'
import { Button } from '@/components/ui/button'
import { Plus, Download } from 'lucide-react'
import Link from 'next/link'

export default function SuperAdminTenantsPage() {
  const { data, loading, fetchTenants } = useTenants()
  const [selectedPlan, setSelectedPlan] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  const filteredTenants = data.filter((t) => {
    if (selectedPlan !== 'all' && t.subscriptionTier !== selectedPlan) return false
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false
    return true
  })

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    const csv = [
      ['Name', 'Subdomain', 'Status', 'Plan', 'Created At'].join(','),
      ...filteredTenants.map((t) =>
        [
          t.name,
          t.subdomain || '',
          t.status,
          t.subscriptionTier,
          new Date(t.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tenants-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenants & Merchants</h1>
          <p className="text-muted-foreground">
            Manage all businesses on the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Link
            href="/super-admin/tenants/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Tenant
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <TenantsTable tenants={filteredTenants} loading={loading} onRefresh={fetchTenants} />
    </div>
  )
}
