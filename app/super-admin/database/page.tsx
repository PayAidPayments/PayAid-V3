'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, HardDrive, Clock } from 'lucide-react'

export default function SuperAdminDatabasePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Database & Backups</h1>
        <p className="text-muted-foreground">Infrastructure control and monitoring</p>
      </div>

      {/* Database Health */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Database Size</CardTitle>
            <HardDrive className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4GB</div>
            <p className="text-xs text-muted-foreground">Growth: +12% month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Query Performance</CardTitle>
            <Clock className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45ms</div>
            <p className="text-xs text-muted-foreground">98th percentile</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Index Health</CardTitle>
            <Database className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Missing indexes</p>
          </CardContent>
        </Card>
      </div>

      {/* Backup Status */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Last Backup</div>
              <div className="text-lg font-semibold">2h ago</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Backup Size</div>
              <div className="text-lg font-semibold">1.8GB</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Retention</div>
              <div className="text-lg font-semibold">7 days</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
