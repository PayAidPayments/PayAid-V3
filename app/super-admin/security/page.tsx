'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, AlertTriangle, Lock, Key } from 'lucide-react'

export default function SuperAdminSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security & Compliance</h1>
        <p className="text-muted-foreground">Enterprise-grade security controls</p>
      </div>

      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Suspicious Logins</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">MFA Adoption</CardTitle>
            <Shield className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Of users enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Failed API Calls</CardTitle>
            <Lock className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">124</div>
            <p className="text-xs text-muted-foreground">Last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">High-Risk Merchants</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Requires review</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: '2h ago', event: 'IP login from new location', severity: 'low' },
              { time: '5h ago', event: 'Multiple failed logins', severity: 'medium' },
              { time: '1d ago', event: 'API key regenerated', severity: 'low' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b last:border-0">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <div className="flex-1">
                  <div className="text-sm">{item.event}</div>
                  <div className="text-xs text-muted-foreground">{item.time}</div>
                </div>
                <Badge variant={item.severity === 'high' ? 'destructive' : 'secondary'}>
                  {item.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
