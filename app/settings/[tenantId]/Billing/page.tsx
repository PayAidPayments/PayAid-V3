'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard } from 'lucide-react'

export default function BillingPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Billing</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Plan, payment method, and invoices</p>
      </div>
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CreditCard className="w-5 h-5" />
            Subscription
          </CardTitle>
          <CardDescription>Manage your plan and payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">View and update your subscription from here.</p>
          <Button variant="outline" asChild>
            <a href={`/settings/${tenantId}`}>Back to Settings</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
