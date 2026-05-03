'use client'

import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Code, Package, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

export default function DeveloperPortalPage() {
  const { data: stats } = useQuery({
    queryKey: ['developer-stats'],
    queryFn: async () => {
      const res = await fetch('/api/developer/portal/stats', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return null
      return res.json()
    },
  })

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Developer Portal</h1>
        <p className="text-gray-600 mt-1">
          Build, publish, and manage your PayAid integrations
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">My Apps</div>
                  <div className="text-2xl font-bold">{stats.appsCount || 0}</div>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Installs</div>
                  <div className="text-2xl font-bold">{stats.totalInstalls || 0}</div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Avg Rating</div>
                  <div className="text-2xl font-bold">
                    {stats.avgRating ? stats.avgRating.toFixed(1) : 'N/A'}
                  </div>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">API Keys</div>
                  <div className="text-2xl font-bold">{stats.apiKeysCount || 0}</div>
                </div>
                <Code className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>My Apps</CardTitle>
            <CardDescription>Manage your published integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/developer/portal/apps">View My Apps</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submit New App</CardTitle>
            <CardDescription>Publish your integration to the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/developer/portal/submit">Submit App</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>API reference and integration guides</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/developer/docs">View Docs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sandbox Testing</CardTitle>
            <CardDescription>Test your apps in isolated environments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/developer/portal/sandbox">Create Sandbox</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
