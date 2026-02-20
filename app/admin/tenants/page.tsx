/**
 * Phase 2: Admin Panel - Tenants Management
 * List and manage all tenants
 */

import { prisma } from '@/lib/db/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function AdminTenantsPage() {
  // Check authentication
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login?redirect=/admin/tenants')
  }

  try {
    const decoded = verifyToken(token)
    
    // Tenants list is Super Admin only; tenant admins use /admin overview
    const isSuperAdmin =
      decoded.roles?.includes('SUPER_ADMIN') ||
      decoded.roles?.includes('super_admin') ||
      decoded.role === 'SUPER_ADMIN' ||
      decoded.role === 'super_admin'
    if (!isSuperAdmin) {
      redirect('/admin')
    }
  } catch {
    redirect('/login?redirect=/admin/tenants')
  }

  // Fetch all tenants
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      subdomain: true,
      status: true,
      subscriptionTier: true,
      licensedModules: true,
      maxUsers: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100, // Limit for performance
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">
            Manage all tenants in the system
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tenants/new">Create Tenant</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{tenant.name}</CardTitle>
                <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                  {tenant.status}
                </Badge>
              </div>
              <CardDescription>
                {tenant.subdomain ? `${tenant.subdomain}.payaid.store` : 'No subdomain'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier:</span>
                  <span className="font-medium">{tenant.subscriptionTier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Users:</span>
                  <span className="font-medium">
                    {tenant._count.users} / {tenant.maxUsers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modules:</span>
                  <span className="font-medium">
                    {tenant.licensedModules?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/admin/tenants/${tenant.id}`}>View</Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/admin/tenants/${tenant.id}/modules`}>Modules</Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/admin/tenants/${tenant.id}/users`}>Users</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tenants.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tenants found</p>
            <Button asChild className="mt-4">
              <Link href="/admin/tenants/new">Create First Tenant</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
