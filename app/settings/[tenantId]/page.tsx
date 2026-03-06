'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Building2, Users, CreditCard, LayoutGrid, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { tenant } = useAuthStore()

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center gap-3">
        <Link href={tenantId ? `/home/${tenantId}` : '/home'} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your workspace and billing</p>
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Building2 className="w-5 h-5" />
            Workspace
          </CardTitle>
          <CardDescription>Business name, GSTIN, address, and documents</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {tenant?.name || 'Your workspace'}
          </p>
          <Link href={`/settings/${tenantId}/Tenant`}>
            <Button variant="outline">Edit workspace</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Users className="w-5 h-5" />
            User management
          </CardTitle>
          <CardDescription>Invite users, roles, and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/settings/${tenantId}/Users`}>
            <Button variant="outline">Manage users</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CreditCard className="w-5 h-5" />
            Billing & subscription
          </CardTitle>
          <CardDescription>Plan, payment method, and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/settings/${tenantId}/Billing`}>
            <Button variant="outline">Billing</Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <LayoutGrid className="w-5 h-5" />
            Modules
          </CardTitle>
          <CardDescription>Enable or disable modules for this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/settings/${tenantId}/Modules`}>
            <Button variant="outline">Module management</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
