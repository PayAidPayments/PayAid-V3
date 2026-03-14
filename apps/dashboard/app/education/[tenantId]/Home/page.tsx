'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Users, BookOpen, Award } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

export default function EducationDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('education') || getModuleConfig('crm')!

  const heroMetrics = [
    { label: 'Students', value: '450', icon: <Users className="w-5 h-5" />, color: 'purple' as const },
    { label: 'Courses', value: '24', icon: <BookOpen className="w-5 h-5" />, color: 'info' as const },
    { label: 'Revenue', value: formatINRForDisplay(2500000), icon: <Award className="w-5 h-5" />, color: 'gold' as const },
    { label: 'Completion Rate', value: '87%', icon: <GraduationCap className="w-5 h-5" />, color: 'success' as const },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Education"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Education Management</CardTitle>
            <CardDescription>Manage students, courses, and educational programs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Education features coming soon...</p>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
