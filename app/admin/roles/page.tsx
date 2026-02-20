'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type RoleRow = {
  id: string
  roleName: string
  roleType: string
  description: string | null
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/roles')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setRoles(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Roles & permissions</h1>
        <p className="text-muted-foreground">Role permissions matrix</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No custom roles; using defaults.</p>
          ) : (
            <div className="space-y-2">
              {roles.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b text-sm">
                  <span className="font-medium">{r.roleName}</span>
                  <span className="text-muted-foreground">{r.roleType}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
