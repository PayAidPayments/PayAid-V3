'use client'

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Calendar, Clock, Users } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function MeetDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const moduleConfig = getModuleConfig('meet') || getModuleConfig('crm')!

  const heroMetrics = [
    { label: 'Upcoming Meetings', value: '0', icon: <Calendar className="w-5 h-5" />, color: 'purple' as const },
    { label: 'Total Meetings', value: '0', icon: <Video className="w-5 h-5" />, color: 'info' as const },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Meet"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-8">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Video Conferencing</CardTitle>
            <CardDescription>HD video conferencing with screen sharing, recording, and collaboration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Video className="w-5 h-5" />
                Start Meeting
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Calendar className="w-5 h-5" />
                Schedule Meeting
              </button>
            </div>
            <div className="text-center py-12 text-gray-500">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No meetings scheduled. Start or schedule a meeting to get started.</p>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
