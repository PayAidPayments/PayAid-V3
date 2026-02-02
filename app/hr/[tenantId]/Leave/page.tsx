'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, FileText, Clock } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function HRLeavePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Leave Management"
        moduleIcon={<Calendar className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Manage employee leave requests and balances"
      />

      <div className="p-6 space-y-8">
        <div className="flex items-center justify-end">
          <Link href={`/hr/${tenantId}/Leave/Apply`}>
            <Button>
              <Calendar className="w-4 h-4 mr-2" />
              Apply for Leave
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href={`/hr/${tenantId}/Leave/Requests`}>
            <GlassCard className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Leave Requests
                </CardTitle>
                <CardDescription>View and manage leave requests</CardDescription>
              </CardHeader>
            </GlassCard>
          </Link>

          <Link href={`/hr/${tenantId}/Leave/Balances`}>
            <GlassCard className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Leave Balances
                </CardTitle>
                <CardDescription>Check leave balances and history</CardDescription>
              </CardHeader>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  )
}
