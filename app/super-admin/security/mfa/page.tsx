'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, UserCheck, UserX } from 'lucide-react'

interface MfaStats {
  total: number
  withMfa: number
  withoutMfa: number
  adoptionPercent: number
}

export default function SuperAdminMfaPage() {
  const [stats, setStats] = useState<MfaStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/users?limit=1000')
      if (res.ok) {
        const json = await res.json()
        const users = json.data || []
        const withMfa = users.filter((u: any) => u.twoFactorEnabled).length
        setStats({
          total: users.length,
          withMfa,
          withoutMfa: users.length - withMfa,
          adoptionPercent: users.length ? Math.round((withMfa / users.length) * 100) : 0,
        })
      } else setStats(null)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/super-admin/security" className="hover:underline">Security & Compliance</Link>
        <span>/</span>
        <span>MFA</span>
      </div>
      <div>
        <h1 className="text-3xl font-bold">MFA Management</h1>
        <p className="text-muted-foreground">
          Multi-factor authentication adoption and policy
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" /> Adoption
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">{stats?.adoptionPercent ?? 0}%</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> With MFA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats?.withMfa ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserX className="h-4 w-4" /> Without MFA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-amber-600">{stats?.withoutMfa ?? 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Reset MFA for a user from Platform Users. Force MFA for high-risk tenants can be added in Security policy settings.
          </p>
        </CardHeader>
        <CardContent>
          <Link href="/super-admin/users">
            <Badge variant="secondary" className="cursor-pointer hover:bg-muted">Platform Users</Badge>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
