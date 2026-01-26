'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { FileText, DollarSign, Calendar, MessageSquare, Settings } from 'lucide-react'
import { format } from 'date-fns'

export default function CustomerPortalPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  // Fetch customer account data
  const { data: accountData, isLoading } = useQuery({
    queryKey: ['customer-account', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/customer-portal/account?tenantId=${tenantId}`)
      if (!response.ok) throw new Error('Failed to fetch account')
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const account = accountData?.data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Portal</h1>
              <p className="mt-1 text-gray-600">Welcome back, {account?.name || 'Customer'}</p>
            </div>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Active Deals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{account?.activeDealsCount || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{account?.totalDealValue?.toLocaleString() || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Open Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{account?.openTicketsCount || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your recent interactions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {account?.recentActivity?.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(activity.date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-8">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Deals</CardTitle>
                <CardDescription>Track the status of your deals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {account?.deals?.map((deal: any) => (
                    <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{deal.name}</div>
                        <div className="text-sm text-gray-500">Stage: {deal.stage}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₹{deal.value?.toLocaleString()}</div>
                        <Badge variant={deal.status === 'won' ? 'default' : 'secondary'}>
                          {deal.status}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-8">No deals found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>View and download your invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {account?.invoices?.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{invoice.number}</div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(invoice.date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold">₹{invoice.amount?.toLocaleString()}</div>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-8">No invoices found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contracts</CardTitle>
                <CardDescription>View your active and expired contracts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {account?.contracts?.map((contract: any) => (
                    <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{contract.title}</div>
                        <div className="text-sm text-gray-500">
                          Valid until: {format(new Date(contract.endDate), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                          {contract.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-8">No contracts found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Support Tickets</CardTitle>
                    <CardDescription>Create and track support requests</CardDescription>
                  </div>
                  <Button>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    New Ticket
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {account?.tickets?.map((ticket: any) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{ticket.subject}</div>
                        <div className="text-sm text-gray-500">
                          Created: {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'}>
                        {ticket.status}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-8">No tickets found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
