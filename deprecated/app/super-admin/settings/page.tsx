'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">Global platform configuration</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Platform Fees (%)</Label>
              <Input type="number" defaultValue="2.5" step="0.1" />
            </div>
            <div>
              <Label>Default Trial Length (days)</Label>
              <Input type="number" defaultValue="14" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Provider API Key</Label>
              <Input type="password" placeholder="Enter API key" />
            </div>
            <div>
              <Label>Provider Secret</Label>
              <Input type="password" placeholder="Enter secret" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>From Email</Label>
              <Input type="email" defaultValue="noreply@payaid.com" />
            </div>
            <div>
              <Label>From Name</Label>
              <Input defaultValue="PayAid Payments" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Default GST Rate (%)</Label>
              <Input type="number" defaultValue="18" />
            </div>
            <div>
              <Label>Tax Country</Label>
              <select className="w-full px-3 py-2 border rounded-md">
                <option>India</option>
                <option>USA</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  )
}
