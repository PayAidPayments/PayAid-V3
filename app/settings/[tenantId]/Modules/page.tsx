'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LayoutGrid } from 'lucide-react'

export default function ModulesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Modules</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Enable or disable modules for this workspace</p>
      </div>
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <LayoutGrid className="w-5 h-5" />
            Module management
          </CardTitle>
          <CardDescription>Turn modules on or off based on your plan</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">CRM, Finance, HR, Marketing, and other modules can be enabled per workspace.</p>
          <Button variant="outline" asChild>
            <a href={`/settings/${tenantId}`}>Back to Settings</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
