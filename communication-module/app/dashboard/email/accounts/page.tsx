'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EmailAccount {
  id: string
  email: string
  displayName?: string
  storageQuotaMB: number
  storageUsedMB: number
  isActive: boolean
  isLocked: boolean
  lastLoginAt?: string
  user: {
    id: string
    name?: string
    email: string
  }
}

export default function EmailAccountsPage() {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    displayName: '',
    password: '',
    storageQuotaMB: '25000',
  })

  const { data, isLoading } = useQuery<{ accounts: EmailAccount[] }>({
    queryKey: ['email-accounts'],
    queryFn: async () => {
      const response = await apiRequest('/api/email/accounts')
      if (!response.ok) throw new Error('Failed to fetch email accounts')
      return response.json()
    },
  })

  const createAccountMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('/api/email/accounts', {
        method: 'POST',
        body: JSON.stringify({
          userId: data.userId,
          email: data.email,
          displayName: data.displayName || undefined,
          password: data.password,
          storageQuotaMB: parseInt(data.storageQuotaMB),
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create email account')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] })
      setShowAddForm(false)
      setFormData({
        userId: '',
        email: '',
        displayName: '',
        password: '',
        storageQuotaMB: '25000',
      })
    },
  })

  const accounts = data?.accounts || []

  const getStoragePercentage = (used: number, quota: number) => {
    return Math.round((used / quota) * 100)
  }

  const getStorageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-100 text-red-800'
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Accounts</h1>
          <p className="mt-2 text-gray-600">
            Manage email accounts for your team
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Email Account'}
        </Button>
      </div>

      {/* Add Email Account Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Email Account</CardTitle>
            <CardDescription>
              Add a new email account for a team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createAccountMutation.mutate(formData)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">User ID *</label>
                  <Input
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    placeholder="User ID from your team"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@company.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Storage Quota (MB)</label>
                  <Input
                    type="number"
                    value={formData.storageQuotaMB}
                    onChange={(e) => setFormData({ ...formData, storageQuotaMB: e.target.value })}
                    placeholder="25000 (25GB)"
                  />
                </div>
              </div>
              {createAccountMutation.isError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {createAccountMutation.error instanceof Error
                    ? createAccountMutation.error.message
                    : 'Failed to create email account'}
                </div>
              )}
              <Button type="submit" disabled={createAccountMutation.isPending}>
                {createAccountMutation.isPending ? 'Creating...' : 'Create Email Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Email Accounts List */}
      {isLoading ? (
        <div className="text-center py-12">Loading email accounts...</div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p>No email accounts found</p>
            <p className="text-sm mt-2">Create your first email account to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => {
            const storagePercentage = getStoragePercentage(
              account.storageUsedMB,
              account.storageQuotaMB
            )
            return (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{account.email}</CardTitle>
                      <CardDescription>
                        {account.displayName || account.user.name || account.user.email}
                        {account.lastLoginAt && (
                          <span className="ml-2">
                            • Last login: {new Date(account.lastLoginAt).toLocaleDateString()}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          account.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {account.isLocked && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Storage Usage */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Storage Usage</span>
                        <span className="text-sm text-gray-600">
                          {account.storageUsedMB} MB / {account.storageQuotaMB} MB
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getStorageColor(storagePercentage).split(' ')[0]}`}
                          style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {storagePercentage}% used
                      </p>
                    </div>

                    {/* Account Info */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">IMAP Server</p>
                        <p className="text-sm font-medium">
                          {process.env.NEXT_PUBLIC_EMAIL_IMAP_HOST || 'imap.payaid.io'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">SMTP Server</p>
                        <p className="text-sm font-medium">
                          {process.env.NEXT_PUBLIC_EMAIL_SMTP_HOST || 'smtp.payaid.io'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
