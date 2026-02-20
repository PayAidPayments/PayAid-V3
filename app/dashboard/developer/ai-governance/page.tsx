'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function AIGovernancePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-7 w-7 text-purple-600" />
          AI Governance
        </h1>
        <p className="text-gray-600 mt-1">
          Manage AI usage policies, permissions, and data handling
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Policy</CardTitle>
          <CardDescription>Your organization's AI usage policy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold">Data Training</div>
              <div className="text-sm text-gray-600">Allow AI to train on your data</div>
            </div>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold">PII Masking</div>
              <div className="text-sm text-gray-600">Automatically mask sensitive data</div>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold">Human Approval Required</div>
              <div className="text-sm text-gray-600">Deal creation, Invoice creation</div>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold">Data Retention</div>
              <div className="text-sm text-gray-600">90 days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Recent AI actions and decisions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/dashboard/developer/ai-governance/audit-trail">
              View Full Audit Trail →
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
