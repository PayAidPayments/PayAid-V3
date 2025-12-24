'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ModuleGate } from '@/components/modules/ModuleGate'
import { useAuthStore } from '@/lib/stores/auth'

interface Website {
  id: string
  name: string
  domain?: string
  subdomain?: string
  status: string
  trackingCode: string
  _count: {
    visits: number
    sessions: number
    pages: number
  }
  createdAt: string
}

function WebsitesPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const { tenant } = useAuthStore()
  
  // Extract tenant ID from pathname (e.g., /dashboard/[tenantId]/websites)
  // or get from auth store
  const pathParts = pathname.split('/').filter(Boolean)
  const tenantIdFromPath = pathParts.length > 1 && pathParts[0] === 'dashboard' && pathParts[1].length > 15 
    ? pathParts[1] 
    : null
  const tenantId = tenantIdFromPath || tenant?.id

  // Helper to create tenant-aware URLs
  const getUrl = (path: string) => {
    if (tenantId) {
      const cleanPath = path.replace(/^\/dashboard\/?/, '')
      return `/dashboard/${tenantId}${cleanPath ? '/' + cleanPath : ''}`
    }
    return path
  }

  const { data, isLoading, refetch } = useQuery<{ websites: Website[] }>({
    queryKey: ['websites'],
    queryFn: async () => {
      const response = await fetch('/api/websites')
      if (!response.ok) throw new Error('Failed to fetch websites')
      return response.json()
    },
  })

  const websites = data?.websites || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Websites</h1>
          <p className="mt-2 text-gray-600">Manage your websites and track analytics</p>
        </div>
        <Link href={getUrl('/dashboard/websites/new')}>
          <Button>Create Website</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : websites.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center max-w-2xl mx-auto">
              <div className="text-6xl mb-4">🏗️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Websites Yet</h2>
              <p className="text-gray-600 mb-6">
                Create your first website to get started with the AI Website Builder. 
                You'll be able to generate React components, use templates, and build beautiful websites with AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={getUrl('/dashboard/websites/new')}>
                  <Button size="lg" className="w-full sm:w-auto">
                    Create Your First Website
                  </Button>
                </Link>
              </div>
              <div className="mt-8 pt-8 border-t">
                <p className="text-sm text-gray-500 mb-3">What you'll get:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">🤖</div>
                    <h3 className="font-semibold mb-1">AI Builder</h3>
                    <p className="text-sm text-gray-600">Generate React components from natural language</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">📦</div>
                    <h3 className="font-semibold mb-1">Templates</h3>
                    <p className="text-sm text-gray-600">Choose from pre-built component templates</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">💡</div>
                    <h3 className="font-semibold mb-1">AI Suggestions</h3>
                    <p className="text-sm text-gray-600">Get AI-powered code improvements</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {websites.map((website) => (
            <Card key={website.id}>
              <CardHeader>
                <CardTitle>{website.name}</CardTitle>
                <CardDescription>
                  {website.domain || website.subdomain || 'No domain configured'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      website.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                      website.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {website.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Visits:</span>
                    <span className="font-semibold">{website._count.visits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sessions:</span>
                    <span className="font-semibold">{website._count.sessions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pages:</span>
                    <span className="font-semibold">{website._count.pages}</span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-xs text-gray-500 mb-2">Tracking Code:</div>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                    {website.trackingCode}
                  </code>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={getUrl(`/dashboard/websites/${website.id}/builder`)} className="flex-1">
                    <Button size="sm" className="w-full">
                      🏗️ Builder
                    </Button>
                  </Link>
                  <Link href={getUrl(`/dashboard/analytics?websiteId=${website.id}`)} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Analytics
                    </Button>
                  </Link>
                  <Link href={getUrl(`/dashboard/websites/${website.id}`)} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WebsitesPage() {
  return (
    <ModuleGate module="ai-studio">
      <WebsitesPageContent />
    </ModuleGate>
  )
}

