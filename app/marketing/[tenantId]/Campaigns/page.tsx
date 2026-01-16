'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
// ModuleTopBar is now in layout.tsx
import { useAuthStore } from '@/lib/stores/auth'
import { Plus, RefreshCw } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  type: string
  subject?: string
  status: string
  scheduledFor?: string
  sentAt?: string
  recipientCount: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  createdAt: string
}

export default function MarketingCampaignsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  
  const { data, isLoading, refetch } = useQuery<{ campaigns: Campaign[] }>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/marketing/campaigns', {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const campaigns = data?.campaigns || []

  return (
    <div className="w-full bg-gray-50 relative" style={{ zIndex: 1 }}>
      {/* ModuleTopBar is now in layout.tsx */}
      {/* Refresh button - moved to page content */}
      <div className="absolute top-20 right-6 z-10">
        <button 
          onClick={() => refetch()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="mt-2 text-gray-600">Manage your marketing campaigns</p>
          </div>
          <Link href="/dashboard/marketing/campaigns/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
            <CardDescription>View and manage all your marketing campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">No campaigns found</p>
                <Link href="/dashboard/marketing/campaigns/new">
                  <Button variant="outline">Create your first campaign</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/marketing/campaigns/${campaign.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {campaign.name}
                        </Link>
                      </TableCell>
                      <TableCell>{campaign.type}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </TableCell>
                      <TableCell>{campaign.recipientCount}</TableCell>
                      <TableCell>{campaign.opened} ({campaign.recipientCount > 0 ? ((campaign.opened / campaign.recipientCount) * 100).toFixed(1) : 0}%)</TableCell>
                      <TableCell>{campaign.clicked} ({campaign.recipientCount > 0 ? ((campaign.clicked / campaign.recipientCount) * 100).toFixed(1) : 0}%)</TableCell>
                      <TableCell>
                        {campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/marketing/campaigns/${campaign.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

