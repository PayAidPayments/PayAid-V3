'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { MessageCircle, Plus } from 'lucide-react'

export default function MarketingWhatsAppPage() {
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
              <Link href={`/marketing/${tenantId}/Email`} className="text-gray-600 hover:text-gray-900 transition-colors">Email</Link>
              <Link href={`/marketing/${tenantId}/Social-Media`} className="text-gray-600 hover:text-gray-900 transition-colors">Social Media</Link>
              <Link href={`/marketing/${tenantId}/WhatsApp`} className="text-purple-600 font-medium border-b-2 border-purple-600 pb-2">WhatsApp</Link>
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
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Marketing</h1>
            <p className="mt-2 text-gray-600">Manage WhatsApp campaigns and messages</p>
          </div>
          <Link href="/dashboard/whatsapp/setup">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Setup WhatsApp
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/whatsapp/inbox">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Inbox
                </CardTitle>
                <CardDescription>View and manage WhatsApp conversations</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/whatsapp/accounts">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>WhatsApp Accounts</CardTitle>
                <CardDescription>Manage connected WhatsApp Business accounts</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

