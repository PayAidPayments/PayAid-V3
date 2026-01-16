'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { Briefcase } from 'lucide-react'

export default function HRHiringPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <div className="w-full bg-gray-50 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">HR</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/hr/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href={`/hr/${tenantId}/Employees`} className="text-gray-600 hover:text-gray-900 transition-colors">Employees</Link>
              <Link href={`/hr/${tenantId}/Payroll`} className="text-gray-600 hover:text-gray-900 transition-colors">Payroll</Link>
              <Link href={`/hr/${tenantId}/Leave`} className="text-gray-600 hover:text-gray-900 transition-colors">Leave</Link>
              <Link href={`/hr/${tenantId}/Attendance`} className="text-gray-600 hover:text-gray-900 transition-colors">Attendance</Link>
              <Link href={`/hr/${tenantId}/Hiring`} className="text-pink-600 font-medium border-b-2 border-pink-600 pb-2">Hiring</Link>
              <Link href={`/hr/${tenantId}/Onboarding`} className="text-gray-600 hover:text-gray-900 transition-colors">Onboarding</Link>
              <Link href={`/hr/${tenantId}/Reports`} className="text-gray-600 hover:text-gray-900 transition-colors">Reports</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ModuleSwitcher currentModule="hr" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hiring</h1>
          <p className="mt-2 text-gray-600">Manage recruitment and hiring process</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/hr/hiring/candidates">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
                <CardDescription>View and manage job candidates</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/hr/hiring/job-requisitions">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Job Requisitions</CardTitle>
                <CardDescription>Create and manage job openings</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/hr/hiring/interviews">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>Interviews</CardTitle>
                <CardDescription>Schedule and manage interviews</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

