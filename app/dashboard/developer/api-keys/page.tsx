'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getAuthHeaders } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ApiKey {
  id: string
  name: string
  scopes: string[]
  rateLimit: number
  ipWhitelist: string[]
  expiresAt: string
  createdAt: string
  usageCount: number
}

interface NewKeyResult {
  apiKey: {
    id: string
    key: string
    name: string
    createdAt: string
    expiresAt: string
  }
  warning: string
}

export default function ApiKeysPage() {
  const queryClient = useQueryClient()
  const [showNewKey, setShowNewKey] = useState<NewKeyResult | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showKey, setShowKey] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await fetch('/api/developer/api-keys', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to load API keys')
      const json = await res.json()
      return json.apiKeys as ApiKey[]
    },
  })

  const { data: scopesData } = useQuery({
    queryKey: ['api-scopes'],
    queryFn: async () => {
      const res = await fetch('/api/developer/scopes', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to load scopes')
      return res.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/developer/api-keys', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create API key')
      }
      return res.json() as Promise<{ apiKey: NewKeyResult['apiKey']; warning: string }>
    },
    onSuccess: (data) => {
      setShowNewKey(data)
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/developer/api-keys/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete API key')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await fetch(`/api/developer/api-keys/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update API key')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const scopes = formData.getAll('scopes') as string[]
    const ipWhitelist = (formData.get('ipWhitelist') as string)
      ?.split(',')
      .map(ip => ip.trim())
      .filter(ip => ip) || []
    
    createMutation.mutate({
      name: formData.get('name'),
      scopes,
      rateLimit: parseInt(formData.get('rateLimit') as string) || 100,
      expiresInDays: parseInt(formData.get('expiresInDays') as string) || 90,
      ipWhitelist,
    })
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const allScopes = scopesData?.scopes
    ? Object.values(scopesData.scopes).flat() as Array<{ value: string; label: string }>
    : []

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="h-7 w-7 text-purple-600" />
            API Keys
          </h1>
          <p className="text-gray-600 mt-1">
            Manage API keys for programmatic access to PayAid APIs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/developer/docs">API Docs</Link>
          </Button>
        </div>
      </div>

      {showNewKey && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Save Your API Key
            </CardTitle>
            <CardDescription>{showNewKey.warning}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>API Key (copy this now)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type={showKey === showNewKey.apiKey.id ? 'text' : 'password'}
                  value={showNewKey.apiKey.key}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKey(showKey === showNewKey.apiKey.id ? null : showNewKey.apiKey.id)}
                >
                  {showKey === showNewKey.apiKey.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(showNewKey.apiKey.key, 'new-key')}
                >
                  {copiedId === 'new-key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={() => setShowNewKey(null)}>I've saved it</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New API Key</CardTitle>
          <CardDescription>Generate a new API key for programmatic access</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Production API Key"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Scopes (select all that apply)</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {allScopes.map((scope) => (
                  <label key={scope.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="scopes"
                      value={scope.value}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">
                      <span className="font-medium">{scope.label}</span>
                      <span className="text-gray-500 ml-2">({scope.value})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                <Input
                  id="rateLimit"
                  name="rateLimit"
                  type="number"
                  defaultValue={100}
                  min={1}
                  max={10000}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="expiresInDays">Expires in (days)</Label>
                <Input
                  id="expiresInDays"
                  name="expiresInDays"
                  type="number"
                  defaultValue={90}
                  min={1}
                  max={365}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ipWhitelist">IP Whitelist (optional, comma-separated)</Label>
              <Input
                id="ipWhitelist"
                name="ipWhitelist"
                placeholder="192.168.1.1, 10.0.0.0/8"
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to allow all IPs. Use CIDR notation for ranges (e.g., 10.0.0.0/8)
              </p>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create API Key'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>Manage existing API keys</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading API keys...</div>
          ) : !data?.length ? (
            <div className="text-center py-8 text-gray-500">
              No API keys yet. Create one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((key) => {
                const isExpired = new Date(key.expiresAt) <= new Date()
                return (
                  <div
                    key={key.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{key.name}</span>
                          {isExpired && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                              Expired
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <div>Scopes: {key.scopes.join(', ')}</div>
                          <div>Rate limit: {key.rateLimit}/hour</div>
                          <div>Usage: {key.usageCount} requests</div>
                          <div>Expires: {new Date(key.expiresAt).toLocaleDateString()}</div>
                          {key.ipWhitelist && key.ipWhitelist.length > 0 && (
                            <div className="mt-2">
                              <span className="font-medium">IP Whitelist:</span>
                              <div className="mt-1 space-y-1">
                                {key.ipWhitelist.map((ip, idx) => (
                                  <code key={idx} className="block text-xs bg-gray-100 px-2 py-1 rounded">
                                    {ip}
                                  </code>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newIp = prompt('Add IP address (or CIDR):')
                            if (newIp) {
                              const updated = [...(key.ipWhitelist || []), newIp.trim()]
                              updateMutation.mutate({
                                id: key.id,
                                updates: { ipWhitelist: updated },
                              })
                            }
                          }}
                          disabled={updateMutation.isPending}
                        >
                          + IP
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Revoke API key "${key.name}"?`)) {
                              deleteMutation.mutate(key.id)
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
