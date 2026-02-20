'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TenantPlanModulesCardProps {
  licensedModules: string[]
  maxUsers: number
  maxContacts: number
  maxInvoices: number
  userCount?: number
}

export function TenantPlanModulesCard({
  licensedModules,
  maxUsers,
  maxContacts,
  maxInvoices,
  userCount = 0,
}: TenantPlanModulesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan & modules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Users</span>
            <p className="font-medium">{userCount} / {maxUsers}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Contacts limit</span>
            <p className="font-medium">{maxContacts}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Invoices limit</span>
            <p className="font-medium">{maxInvoices}</p>
          </div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Licensed modules</span>
          <div className="mt-2 flex flex-wrap gap-1">
            {(licensedModules ?? []).length === 0 ? (
              <span className="text-sm text-muted-foreground">None</span>
            ) : (
              (licensedModules ?? []).map((m) => (
                <Badge key={m} variant="secondary" className="text-xs">
                  {m}
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}