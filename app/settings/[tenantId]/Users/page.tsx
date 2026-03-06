'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users as UsersIcon } from 'lucide-react'

export default function UsersPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Users</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Invite users, roles, and permissions</p>
      </div>
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <UsersIcon className="w-5 h-5" />
            Team members
          </CardTitle>
          <CardDescription>Manage who has access to this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Add and remove users, assign roles (admin, member), and manage permissions.</p>
          <Button variant="outline" asChild>
            <a href={`/settings/${tenantId}`}>Back to Settings</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
