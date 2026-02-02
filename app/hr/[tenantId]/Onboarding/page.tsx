'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, FileText } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function HROnboardingPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Onboarding"
        moduleIcon={<UserPlus className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Manage employee onboarding process"
      />

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href={`/hr/${tenantId}/Onboarding/Templates`}>
            <GlassCard className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Onboarding Templates
                </CardTitle>
                <CardDescription>Create and manage onboarding templates</CardDescription>
              </CardHeader>
            </GlassCard>
          </Link>

          <Link href={`/hr/${tenantId}/Onboarding/Instances`}>
            <GlassCard className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Onboarding Instances
                </CardTitle>
                <CardDescription>View active onboarding processes</CardDescription>
              </CardHeader>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  )
}

