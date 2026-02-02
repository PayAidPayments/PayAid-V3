'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Calendar } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function HRAttendancePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Attendance"
        moduleIcon={<Clock className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Track employee attendance and check-ins"
      />

      <div className="p-6 space-y-8">
        <div className="flex items-center justify-end">
          <Link href={`/hr/${tenantId}/Attendance/Check-In`}>
            <Button>
              <Clock className="w-4 h-4 mr-2" />
              Check In
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href={`/hr/${tenantId}/Attendance/Calendar`}>
            <GlassCard className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Attendance Calendar
                </CardTitle>
                <CardDescription>View attendance calendar and records</CardDescription>
              </CardHeader>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  )
}
