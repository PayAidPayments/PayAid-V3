'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function SuperAdminIntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations & API</h1>
        <p className="text-muted-foreground">Monitor all platform integrations</p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">WhatsApp Provider</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground">Uptime | 12.4K messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Payment Gateway</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1%</div>
            <p className="text-xs text-muted-foreground">Failures | ₹1.2Cr processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Email Provider</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97%</div>
            <p className="text-xs text-muted-foreground">Delivery rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Database</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124ms</div>
            <p className="text-xs text-muted-foreground">Avg latency | 0 lag</p>
          </CardContent>
        </Card>
      </div>

      {/* API Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage by Merchant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { merchant: 'Demo Business', calls: '847K', rateLimit: '80%', errors: '1.2%' },
              { merchant: 'Sample Co', calls: '234K', rateLimit: '45%', errors: '0.5%' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b">
                <div className="font-medium">{item.merchant}</div>
                <div className="flex items-center gap-4 text-sm">
                  <span>{item.calls} calls</span>
                  <Badge variant="outline">{item.rateLimit} limit</Badge>
                  <span className={item.errors > '1%' ? 'text-red-500' : 'text-green-500'}>
                    {item.errors} errors
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
