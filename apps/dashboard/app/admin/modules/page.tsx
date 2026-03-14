'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminAIAssistantPanel } from '@/components/Admin/ai/AdminAIAssistantPanel'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminModulesPage() {
  const [modules, setModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/modules')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setModules(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modules</h1>
        <p className="text-muted-foreground">Enabled modules for this tenant</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Licensed modules</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No modules enabled</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {modules.map((m) => (
                <Badge key={m} variant="secondary">{m}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <AdminAIAssistantPanel context="modules" />
    </div>
  )
}
