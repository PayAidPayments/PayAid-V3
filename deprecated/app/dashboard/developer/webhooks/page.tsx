'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getAuthHeaders } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Webhook, Plus, Trash2, Copy, Check, AlertCircle, FileText } from 'lucide-react'

const AVAILABLE_EVENTS = [
  { value: 'contact.created', label: 'Contact Created' },
  { value: 'contact.updated', label: 'Contact Updated' },
  { value: 'deal.created', label: 'Deal Created' },
  { value: 'deal.updated', label: 'Deal Updated' },
  { value: 'deal.stage_changed', label: 'Deal Stage Changed' },
  { value: 'invoice.created', label: 'Invoice Created' },
  { value: 'invoice.paid', label: 'Invoice Paid' },
  { value: 'invoice.overdue', label: 'Invoice Overdue' },
  { value: 'workflow.executed', label: 'Workflow Executed' },
]

interface WebhookItem {
  id: string
  url: string
  events: string[]
  description: string | null
  isActive: boolean
  lastTriggeredAt: string | null
  failureCount: number
  createdAt: string
}

interface NewWebhookResult {
  webhook: {
    id: string
    url: string
    events: string[]
    secret: string
    description: string | null
    isActive: boolean
    createdAt: string
  }
  warning: string
}

export default function WebhooksPage() {
  const queryClient = useQueryClient()
  const [showNewWebhook, setShowNewWebhook] = useState<NewWebhookResult | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const res = await fetch('/api/developer/webhooks', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to load webhooks')
      const json = await res.json()
      return json.webhooks as WebhookItem[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/developer/webhooks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create webhook')
      }
      return res.json() as Promise<NewWebhookResult>
    },
    onSuccess: (data) => {
      setShowNewWebhook(data)
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/developer/webhooks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete webhook')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const events = formData.getAll('events') as string[]
    createMutation.mutate({
      url: formData.get('url'),
      events,
      description: formData.get('description') || undefined,
    })
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Webhook className="h-7 w-7 text-purple-600" />
          Webhooks
        </h1>
        <p className="text-gray-600 mt-1">
          Receive real-time events from PayAid via HTTP callbacks
        </p>
      </div>

      {showNewWebhook && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Save Your Webhook Secret
            </CardTitle>
            <CardDescription>{showNewWebhook.warning}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Webhook Secret (copy this now)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="text"
                  value={showNewWebhook.webhook.secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(showNewWebhook.webhook.secret, 'new-secret')}
                >
                  {copiedId === 'new-secret' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={() => setShowNewWebhook(null)}>I've saved it</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New Webhook</CardTitle>
          <CardDescription>Register a webhook endpoint to receive events</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="url">Webhook URL</Label>
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://your-app.com/webhooks/payaid"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label>Events (select all that apply)</Label>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                {AVAILABLE_EVENTS.map((event) => (
                  <label key={event.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="events"
                      value={event.value}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="What this webhook is for"
                className="mt-1"
                rows={2}
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Webhook'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Webhooks</CardTitle>
          <CardDescription>Manage registered webhook endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading webhooks...</div>
          ) : !data?.length ? (
            <div className="text-center py-8 text-gray-500">
              No webhooks yet. Create one above to start receiving events.
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((webhook) => (
                <div
                  key={webhook.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{webhook.url}</span>
                        {!webhook.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                            Inactive
                          </span>
                        )}
                        {webhook.failureCount > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                            {webhook.failureCount} failures
                          </span>
                        )}
                      </div>
                      {webhook.description && (
                        <p className="text-sm text-gray-600 mt-1">{webhook.description}</p>
                      )}
                      <div className="mt-2 text-sm text-gray-600">
                        <div>Events: {webhook.events.join(', ')}</div>
                        {webhook.lastTriggeredAt && (
                          <div>Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(`/dashboard/developer/webhooks/${webhook.id}/logs`, '_blank')
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete webhook "${webhook.url}"?`)) {
                            deleteMutation.mutate(webhook.id)
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
