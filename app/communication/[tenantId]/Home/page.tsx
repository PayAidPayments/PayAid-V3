'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Users, Phone, Mail } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function CommunicationDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('communication') || getModuleConfig('crm')!

  const heroMetrics = [
    { label: 'Messages', value: '1.2K', icon: <MessageSquare className="w-5 h-5" />, color: 'purple' as const },
    { label: 'Team Members', value: '24', icon: <Users className="w-5 h-5" />, color: 'info' as const },
    { label: 'Calls', value: '156', icon: <Phone className="w-5 h-5" />, color: 'success' as const },
    { label: 'Emails', value: '890', icon: <Mail className="w-5 h-5" />, color: 'gold' as const },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Communication"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Team Communication</CardTitle>
            <CardDescription>Manage team messages, calls, and collaboration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Communication features coming soon...</p>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
