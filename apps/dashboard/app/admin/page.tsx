'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Puzzle, Shield } from 'lucide-react'
import { AdminAIAssistantPanel } from '@/components/Admin/ai/AdminAIAssistantPanel'

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<{ users: number; modules: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((j) => setStats(j.data ?? null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin overview</h1>
        <p className="text-muted-foreground">Users, usage, modules, security snapshot</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <span className="text-2xl font-bold">{stats?.users ?? 0}</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Modules enabled</CardTitle>
            <Puzzle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <span className="text-2xl font-bold">{stats?.modules ?? 0}</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-sm text-muted-foreground">OK</span>
          </CardContent>
        </Card>
      </div>
      <AdminAIAssistantPanel context="overview" />
    </div>
  )
}
