'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Stethoscope, Users, Calendar, FileText } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

export default function HealthcareDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('healthcare') || getModuleConfig('crm')!

  const heroMetrics = [
    { label: 'Patients', value: '320', icon: <Users className="w-5 h-5" />, color: 'purple' as const },
    { label: 'Appointments', value: '45', icon: <Calendar className="w-5 h-5" />, color: 'info' as const },
    { label: 'Revenue', value: formatINRForDisplay(1800000), icon: <FileText className="w-5 h-5" />, color: 'gold' as const },
    { label: 'Doctors', value: '12', icon: <Stethoscope className="w-5 h-5" />, color: 'success' as const },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Healthcare"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Healthcare Management</CardTitle>
            <CardDescription>Manage patients, appointments, and medical records</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Healthcare features coming soon...</p>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
