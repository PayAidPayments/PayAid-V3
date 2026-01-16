'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { BarChart3 } from 'lucide-react'

export default function HRReportsPage() {
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
              <Link href={`/hr/${tenantId}/Hiring`} className="text-gray-600 hover:text-gray-900 transition-colors">Hiring</Link>
              <Link href={`/hr/${tenantId}/Onboarding`} className="text-gray-600 hover:text-gray-900 transition-colors">Onboarding</Link>
              <Link href={`/hr/${tenantId}/Reports`} className="text-pink-600 font-medium border-b-2 border-pink-600 pb-2">Reports</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ModuleSwitcher currentModule="hr" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HR Reports</h1>
          <p className="mt-2 text-gray-600">View HR analytics and reports</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Available Reports
            </CardTitle>
            <CardDescription>HR reports and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">HR reports are available in the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

