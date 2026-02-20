'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { TestTube, Plus, Trash2, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export default function SandboxPage() {
  const queryClient = useQueryClient()
  const [sandboxName, setSandboxName] = useState('')

  const { data: sandboxes, isLoading } = useQuery({
    queryKey: ['sandbox-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/admin/sandbox-tenant', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return []
      const json = await res.json()
      return json.sandboxes || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/admin/sandbox-tenant', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create sandbox')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sandbox-tenants'] })
      setSandboxName('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/sandbox-tenant/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete sandbox')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sandbox-tenants'] })
    },
  })

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TestTube className="h-7 w-7 text-purple-600" />
          Sandbox Testing
        </h1>
        <p className="text-gray-600 mt-1">
          Create isolated test environments for your apps
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Sandbox</CardTitle>
          <CardDescription>Create an isolated tenant for testing your apps</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (sandboxName.trim()) {
                createMutation.mutate(sandboxName.trim())
              }
            }}
            className="flex gap-2"
          >
            <div className="flex-1">
              <Label htmlFor="sandboxName">Sandbox Name</Label>
              <Input
                id="sandboxName"
                value={sandboxName}
                onChange={(e) => setSandboxName(e.target.value)}
                placeholder="e.g., Test Environment 1"
                className="mt-1"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {createMutation.isPending ? 'Creating...' : 'Create Sandbox'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Sandboxes</CardTitle>
          <CardDescription>Manage your test environments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading sandboxes...</div>
          ) : !sandboxes || sandboxes.length === 0 ? (
            <div className="text-center py-12">
              <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No sandboxes yet. Create one above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sandboxes.map((sandbox: any) => (
                <div
                  key={sandbox.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{sandbox.name}</span>
                        <Badge variant="secondary">Sandbox</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Created: {new Date(sandbox.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/home/${sandbox.id}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete sandbox "${sandbox.name}"?`)) {
                          deleteMutation.mutate(sandbox.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
