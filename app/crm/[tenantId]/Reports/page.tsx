'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CRMReportsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <div className="w-full bg-gray-50 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar - Zoho Style */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">CRM</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/crm/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href={`/crm/${tenantId}/Leads`} className="text-gray-600 hover:text-gray-900">Leads</Link>
              <Link href={`/crm/${tenantId}/Contacts`} className="text-gray-600 hover:text-gray-900">Contacts</Link>
              <Link href={`/crm/${tenantId}/Accounts`} className="text-gray-600 hover:text-gray-900">Accounts</Link>
              <Link href={`/crm/${tenantId}/Deals`} className="text-gray-600 hover:text-gray-900">Deals</Link>
              <Link href={`/crm/${tenantId}/Tasks`} className="text-gray-600 hover:text-gray-900">Tasks</Link>
              <Link href={`/crm/${tenantId}/Reports`} className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">Reports</Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">View CRM analytics and reports</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline Report</CardTitle>
              <CardDescription>View deals by stage</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Conversion Report</CardTitle>
              <CardDescription>Track lead to deal conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Report</CardTitle>
              <CardDescription>View team activity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

