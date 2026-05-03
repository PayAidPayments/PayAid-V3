'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Phone, BarChart3 } from 'lucide-react'

export default function SuperAdminWhatsAppPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mobile & WhatsApp</h1>
        <p className="text-muted-foreground">
          Platform-wide WhatsApp and mobile channel configuration
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              WhatsApp Business
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure default WhatsApp Business API settings, templates, and rate limits. Tenant-level configuration is managed in their Integrations.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              SMS & Voice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Global SMS and voice provider settings. Per-tenant overrides available in their admin.
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Channel Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Usage analytics and health for WhatsApp/SMS across all tenants. Connect to your provider dashboard for detailed metrics.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
