'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'
import { Copy, Eye, BarChart3, Settings } from 'lucide-react'

interface Website {
  id: string
  name: string
  domain: string
  description?: string
  trackingCode: string
  createdAt: string
}

export default function WebsitesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
  })

  const { data, isLoading, refetch } = useQuery<{ websites: Website[] }>({
    queryKey: ['websites'],
    queryFn: async () => {
      const response = await fetch('/api/websites')
      if (!response.ok) throw new Error('Failed to fetch websites')
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create website')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
      setShowCreateModal(false)
      setFormData({ name: '', domain: '', description: '' })
    },
  })

  const copyTrackingCode = (code: string) => {
    const script = `<script data-tracking-code="${code}" src="/payaid-tracker.js"></script>`
    navigator.clipboard.writeText(script)
    alert('Tracking code copied to clipboard!')
  }

  const websites = data?.websites || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Website Analytics</h1>
          <p className="mt-2 text-gray-600">Track visitors and analyze website performance</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Add Website</Button>
      </div>

      {isLoading ? (
        <PageLoading message="Loading websites..." fullScreen={false} />
      ) : websites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">No websites added yet</p>
            <Button onClick={() => setShowCreateModal(true)}>Add Your First Website</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((website) => (
            <Card key={website.id}>
              <CardHeader>
                <CardTitle>{website.name}</CardTitle>
                <CardDescription>{website.domain}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {website.description && (
                    <p className="text-sm text-gray-600">{website.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500">Tracking Code</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={website.trackingCode}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyTrackingCode(website.trackingCode)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Add this script tag to your website
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/websites/${website.id}/analytics`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </Button>
                    </Link>
                    <Link href={`/dashboard/websites/${website.id}/settings`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Website Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Website</CardTitle>
              <CardDescription>Track visitors and analyze performance</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  createMutation.mutate(formData)
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Website"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Domain *</label>
                  <Input
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="e.g., example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
