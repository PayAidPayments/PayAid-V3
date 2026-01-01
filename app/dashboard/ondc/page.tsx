'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, Settings, Package, ShoppingCart } from 'lucide-react'

function ONDCPageContent() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    sellerId: '',
    sellerAppId: '',
    sellerAppKey: '',
    networkId: 'ONDC:RETail',
    isTestMode: true,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['ondc-integration'],
    queryFn: async () => {
      const response = await fetch('/api/ondc/integration', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch ONDC integration')
      return response.json()
    },
  })

  const updateIntegration = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/ondc/integration', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update integration')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ondc-integration'] })
      setIsEditing(false)
    },
  })

  const syncProducts = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ondc/products/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to sync products')
      return response.json()
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const integration = data?.integration

  if (!integration && !isEditing) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ONDC Integration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect your business to the Open Network for Digital Commerce
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">ONDC integration not configured</p>
            <Button onClick={() => setIsEditing(true)}>
              Configure Integration
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayData = integration || formData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ONDC Integration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your ONDC seller account and product listings
          </p>
        </div>
        {integration && !isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Edit Settings
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Integration Settings</CardTitle>
            <CardDescription>Configure your ONDC seller credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Seller ID *</label>
              <Input
                value={formData.sellerId}
                onChange={(e) => setFormData({ ...formData, sellerId: e.target.value })}
                placeholder="Your ONDC seller ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Seller App ID *</label>
              <Input
                value={formData.sellerAppId}
                onChange={(e) => setFormData({ ...formData, sellerAppId: e.target.value })}
                placeholder="Your seller app ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Seller App Key *</label>
              <Input
                type="password"
                value={formData.sellerAppKey}
                onChange={(e) => setFormData({ ...formData, sellerAppKey: e.target.value })}
                placeholder="Your seller app key"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Network ID</label>
              <Input
                value={formData.networkId}
                onChange={(e) => setFormData({ ...formData, networkId: e.target.value })}
                placeholder="ONDC:RETail"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="testMode"
                checked={formData.isTestMode}
                onChange={(e) => setFormData({ ...formData, isTestMode: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="testMode" className="text-sm">
                Test Mode
              </label>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  updateIntegration.mutate(formData)
                }}
                disabled={updateIntegration.isPending}
              >
                {updateIntegration.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
              {integration && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      sellerId: integration.sellerId || '',
                      sellerAppId: integration.sellerAppId || '',
                      sellerAppKey: '',
                      networkId: integration.networkId || 'ONDC:RETail',
                      isTestMode: integration.isTestMode || false,
                    })
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {integration ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium">Not Connected</span>
                    </>
                  )}
                </div>
                {integration && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Seller ID</label>
                      <div className="mt-1 font-mono text-sm">{integration.sellerId}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Network</label>
                      <div className="mt-1">{integration.networkId}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Mode</label>
                      <div className="mt-1">
                        {integration.isTestMode ? 'Test Mode' : 'Production Mode'}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {integration && integration._count ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-gray-400" />
                        <span>Products Listed</span>
                      </div>
                      <span className="font-bold text-lg">{integration._count.products || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-gray-400" />
                        <span>Orders Received</span>
                      </div>
                      <span className="font-bold text-lg">{integration._count.orders || 0}</span>
                    </div>
                    <Button
                      onClick={() => syncProducts.mutate()}
                      disabled={syncProducts.isPending}
                      className="w-full mt-4"
                    >
                      {syncProducts.isPending ? 'Syncing...' : 'Sync Products'}
                    </Button>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">No statistics available</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>Manage your ONDC product listings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">
                Product listing management will be available here. Use the API endpoints to manage products.
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default function ONDCPage() {
  return <ONDCPageContent />
}

