'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { ModuleGate } from '@/components/modules/ModuleGate'
import { useAuthStore } from '@/lib/stores/auth'

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

export default function CampaignsPage() {
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

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      email: '📧',
      whatsapp: '💬',
      sms: '📱',
    }
    return icons[type] || '📢'
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const campaigns = data?.campaigns || []

  return (
    <ModuleGate module="marketing">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing Campaigns</h1>
          <p className="mt-2 text-gray-600">Manage your email, WhatsApp, and SMS campaigns</p>
        </div>
        <Link href="/dashboard/marketing/campaigns/new">
          <Button>Create Campaign</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {campaigns.filter((c) => c.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.sent, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Avg Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {campaigns.length > 0
                ? (
                    (campaigns.reduce((sum, c) => sum + (c.opened / Math.max(c.sent, 1)), 0) /
                      campaigns.length) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
          <CardDescription>View and manage all your marketing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No campaigns found</p>
              <Link href="/dashboard/marketing/campaigns/new">
                <Button>Create Your First Campaign</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        {campaign.subject && (
                          <div className="text-sm text-gray-500">{campaign.subject}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xl">{getTypeIcon(campaign.type)}</span>
                      <span className="ml-2 capitalize">{campaign.type}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell>{campaign.recipientCount.toLocaleString()}</TableCell>
                    <TableCell>{campaign.sent.toLocaleString()}</TableCell>
                    <TableCell>
                      {campaign.sent > 0
                        ? `${((campaign.opened / campaign.sent) * 100).toFixed(1)}%`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {campaign.sent > 0
                        ? `${((campaign.clicked / campaign.sent) * 100).toFixed(1)}%`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {campaign.createdAt
                        ? format(new Date(campaign.createdAt), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/marketing/campaigns/${campaign.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
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
    </ModuleGate>
  )
}
