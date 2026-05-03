'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Activity, AlertTriangle } from 'lucide-react'

interface TenantHealthRow {
  tenantId: string
  tenantName: string
  healthScore: number
  activeUsers: number
  totalUsers: number
  status: string
}

export default function SuperAdminTenantHealthPage() {
  const [rows, setRows] = useState<TenantHealthRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealth()
  }, [])

  const fetchHealth = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/tenant-health')
      if (res.ok) {
        const json = await res.json()
        setRows(json.data || [])
      } else setRows([])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const atRisk = rows.filter((r) => r.healthScore < 40)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tenant Health</h1>
        <p className="text-muted-foreground">
          Activity and health scores per tenant
        </p>
      </div>

      {atRisk.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              At-risk tenants ({atRisk.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {atRisk.map((r) => (
                <Link
                  key={r.tenantId}
                  href={`/super-admin/tenants/${r.tenantId}`}
                  className="flex items-center justify-between text-sm hover:underline"
                >
                  <span className="font-medium">{r.tenantName}</span>
                  <span className="text-muted-foreground">Health: {r.healthScore}%</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No tenant health data yet.</div>
          ) : (
            <div className="space-y-4">
              {rows.map((r) => (
                <div key={r.tenantId} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Link href={`/super-admin/tenants/${r.tenantId}`} className="font-medium hover:underline">
                      {r.tenantName}
                    </Link>
                    <span className="text-muted-foreground">
                      {r.activeUsers}/{r.totalUsers} users · {r.healthScore}%
                    </span>
                  </div>
                  <Progress value={r.healthScore} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
