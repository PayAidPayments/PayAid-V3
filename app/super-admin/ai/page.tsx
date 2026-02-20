'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Zap, TrendingUp } from 'lucide-react'

export default function SuperAdminAIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI & Automations</h1>
        <p className="text-muted-foreground">AI platform control and usage</p>
      </div>

      {/* AI Usage */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Total Calls</CardTitle>
            <Bot className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847K</div>
            <p className="text-xs text-muted-foreground">Cost: ₹2,450</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Avg Response Time</CardTitle>
            <Zap className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">Response latency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Success Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97.8%</div>
            <p className="text-xs text-muted-foreground">Successful calls</p>
          </CardContent>
        </Card>
      </div>

      {/* Top AI Features */}
      <Card>
        <CardHeader>
          <CardTitle>Top AI Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { feature: 'Sequence Generator', uses: 124 },
              { feature: 'Email Drafter', uses: 847 },
              { feature: 'Lead Scoring', uses: 2300 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b">
                <div className="font-medium">{item.feature}</div>
                <div className="text-sm text-muted-foreground">{item.uses} uses</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
