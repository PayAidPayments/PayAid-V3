'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Factory, Package, TrendingUp, Settings } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

export default function ManufacturingDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('manufacturing') || getModuleConfig('crm')!

  const heroMetrics = [
    { label: 'Production Units', value: '1.2K', icon: <Factory className="w-5 h-5" />, color: 'purple' as const },
    { label: 'Orders', value: '156', icon: <Package className="w-5 h-5" />, color: 'info' as const },
    { label: 'Revenue', value: formatINRForDisplay(5200000), icon: <TrendingUp className="w-5 h-5" />, color: 'gold' as const },
    { label: 'Efficiency', value: '92%', icon: <Settings className="w-5 h-5" />, color: 'success' as const },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Manufacturing"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Manufacturing Operations</CardTitle>
            <CardDescription>Manage production, orders, and manufacturing processes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Manufacturing features coming soon...</p>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
