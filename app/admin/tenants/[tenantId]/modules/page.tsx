/**
 * Phase 2: Admin Panel - Tenant Module Management
 * Enable/disable modules for a specific tenant
 */

import { prisma } from '@/lib/db/prisma'
import { verifyToken } from '@/lib/auth/jwt'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getAllModules } from '@/lib/modules/moduleRegistry'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ModuleToggle } from '@/components/Admin/ModuleToggle'

interface PageProps {
  params: {
    tenantId: string
  }
}

export default async function TenantModulesPage({ params }: PageProps) {
  // Check authentication
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login?redirect=/admin/tenants')
  }

  try {
    const decoded = verifyToken(token)
    
    // Check if super admin
    const isSuperAdmin = decoded.roles?.includes('super_admin') || 
                        decoded.role === 'super_admin'
    
    if (!isSuperAdmin) {
      redirect('/dashboard')
    }
  } catch {
    redirect('/login?redirect=/admin/tenants')
  }

  // Fetch tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    select: {
      id: true,
      name: true,
      licensedModules: true,
      subscriptionTier: true,
    },
  })

  if (!tenant) {
    notFound()
  }

  // Get all available modules
  const allModules = getAllModules()
  const enabledModules = tenant.licensedModules || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Module Management</h1>
        <p className="text-muted-foreground">
          Enable or disable modules for {tenant.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allModules.map((module) => {
          const isEnabled = enabledModules.includes(module.id)
          const isDefault = module.enabled_by_default

          return (
            <Card key={module.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{module.name}</CardTitle>
                  <div className="flex gap-2">
                    {isEnabled && <Badge variant="default">Enabled</Badge>}
                    {isDefault && <Badge variant="outline">Default</Badge>}
                    <Badge variant="secondary">{module.category}</Badge>
                  </div>
                </div>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <div>Routes: {module.routes.length}</div>
                  <div>Required: {module.required_permissions.join(', ')}</div>
                </div>
                
                <ModuleToggle
                  tenantId={tenant.id}
                  moduleId={module.id}
                  enabled={isEnabled}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
