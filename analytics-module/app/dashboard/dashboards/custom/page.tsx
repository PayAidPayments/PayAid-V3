'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CustomDashboard {
  id: string
  name: string
  description?: string
  isDefault: boolean
  isPublic: boolean
  createdAt: string
}

export default function CustomDashboardsPage() {
  const { data, isLoading } = useQuery<{ dashboards: CustomDashboard[] }>({
    queryKey: ['custom-dashboards'],
    queryFn: async () => {
      const response = await fetch('/api/dashboards/custom')
      if (!response.ok) throw new Error('Failed to fetch custom dashboards')
      return response.json()
    },
  })

  const dashboards = data?.dashboards || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Custom Dashboards</h1>
          <p className="mt-2 text-gray-600">Create and manage custom dashboards with widgets</p>
        </div>
        <Button>Create Dashboard</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : dashboards.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No custom dashboards found</p>
              <Button>Create Your First Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{dashboard.name}</CardTitle>
                  {dashboard.isDefault && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Default
                    </span>
                  )}
                </div>
                {dashboard.description && (
                  <CardDescription>{dashboard.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Public:</span>
                    <span className={dashboard.isPublic ? 'text-green-600' : 'text-gray-400'}>
                      {dashboard.isPublic ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
