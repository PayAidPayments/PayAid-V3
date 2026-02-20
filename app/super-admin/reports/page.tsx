'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'

export default function SuperAdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Exports</h1>
        <p className="text-muted-foreground">Self-service analytics and exports</p>
      </div>

      {/* Quick Reports */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Merchant Revenue Summary', description: 'Revenue by merchant and plan' },
          { title: 'User Activity Report', description: 'Login and usage statistics' },
          { title: 'Payment Failures', description: 'Failed transactions analysis' },
          { title: 'WhatsApp Performance', description: 'Message delivery and engagement' },
          { title: 'CRM Adoption', description: 'Module usage and adoption rates' },
        ].map((report, idx) => (
          <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2 mt-1">
                <input type="date" className="px-3 py-2 border rounded-md text-sm" />
                <input type="date" className="px-3 py-2 border rounded-md text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Metrics</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['Revenue', 'Users', 'Transactions', 'WhatsApp', 'CRM'].map((metric) => (
                  <label key={metric} className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span className="text-sm">{metric}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button>Generate Custom Report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
