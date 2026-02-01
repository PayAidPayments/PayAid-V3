'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, MapPin, IndianRupee } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

export default function RealEstateDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('real-estate') || getModuleConfig('crm')!

  const heroMetrics = [
    { label: 'Properties', value: '0', icon: <Home className="w-5 h-5" />, color: 'purple' as const },
    { label: 'Total Value', value: formatINRForDisplay(0), icon: <IndianRupee className="w-5 h-5" />, color: 'gold' as const },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Real Estate"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Real Estate Management</CardTitle>
            <CardDescription>Property management, leads, site visits, and documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Real estate management features coming soon.</p>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
