'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Users, FileText, Calendar } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function HRHiringPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Hiring"
        moduleIcon={<Briefcase className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Manage recruitment and hiring process"
      />

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href={`/hr/${tenantId}/Hiring/Candidates`}>
            <GlassCard className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Candidates
                </CardTitle>
                <CardDescription>View and manage job candidates</CardDescription>
              </CardHeader>
            </GlassCard>
          </Link>

          <Link href={`/hr/${tenantId}/Hiring/Job-Requisitions`}>
            <GlassCard className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Job Requisitions
                </CardTitle>
                <CardDescription>Create and manage job postings</CardDescription>
              </CardHeader>
            </GlassCard>
          </Link>

          <Link href={`/hr/${tenantId}/Hiring/Interviews`}>
            <GlassCard className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Interviews
                </CardTitle>
                <CardDescription>Schedule and manage interviews</CardDescription>
              </CardHeader>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  )
}
