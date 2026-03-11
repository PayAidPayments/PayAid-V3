'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CRMActivitiesPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg">Activities</CardTitle>
          <CardDescription>Calls, emails, meetings, and notes for this tenant.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href={`/crm/${tenantId}/Leads`}>
            <Button variant="outline">Go to Leads</Button>
          </Link>
          <Link href={`/crm/${tenantId}/Deals`}>
            <Button variant="outline">Go to Deals</Button>
          </Link>
          <Link href={`/crm/${tenantId}/Contacts`}>
            <Button variant="outline">Go to Contacts</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}