'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, Plus } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function SpreadsheetDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('spreadsheet') || getModuleConfig('crm')!

  const heroMetrics = [
    { label: 'Spreadsheets', value: '0', icon: <Table className="w-5 h-5" />, color: 'purple' as const },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Spreadsheet"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Spreadsheets</CardTitle>
            <CardDescription>Create and manage spreadsheets with formulas, charts, and collaboration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-end mb-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Plus className="w-5 h-5" />
                New Spreadsheet
              </button>
            </div>
            <div className="text-center py-12 text-gray-500">
              <Table className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No spreadsheets yet. Create your first spreadsheet to get started.</p>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
