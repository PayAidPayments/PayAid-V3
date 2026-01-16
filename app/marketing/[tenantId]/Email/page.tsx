'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { Mail, Plus, RefreshCw } from 'lucide-react'

export default function MarketingEmailPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <div className="w-full bg-gray-50 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">Marketing</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/marketing/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href={`/marketing/${tenantId}/Campaigns`} className="text-gray-600 hover:text-gray-900 transition-colors">Campaigns</Link>
              <Link href={`/marketing/${tenantId}/Email`} className="text-purple-600 font-medium border-b-2 border-purple-600 pb-2">Email</Link>
              <Link href={`/marketing/${tenantId}/Social-Media`} className="text-gray-600 hover:text-gray-900 transition-colors">Social Media</Link>
              <Link href={`/marketing/${tenantId}/WhatsApp`} className="text-gray-600 hover:text-gray-900 transition-colors">WhatsApp</Link>
              <Link href={`/marketing/${tenantId}/Analytics`} className="text-gray-600 hover:text-gray-900 transition-colors">Analytics</Link>
              <Link href={`/marketing/${tenantId}/Segments`} className="text-gray-600 hover:text-gray-900 transition-colors">Segments</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ModuleSwitcher currentModule="marketing" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Marketing</h1>
            <p className="mt-2 text-gray-600">Manage email campaigns and templates</p>
          </div>
          <Link href="/dashboard/email-templates/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Email Template
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email Campaigns</CardTitle>
            <CardDescription>Manage your email marketing campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Email marketing features are available in the Email Campaigns section.</p>
            <Link href="/dashboard/marketing/campaigns">
              <Button variant="outline">View Email Campaigns</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

