'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Zap, Link as LinkIcon, Copy, CheckCircle } from 'lucide-react'

const INTEGRATIONS = [
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect PayAid with 5000+ apps via Zapier',
    icon: '⚡',
    enabled: false,
  },
  {
    id: 'make',
    name: 'Make.com (Integromat)',
    description: 'Automate workflows with Make.com',
    icon: '🔗',
    enabled: false,
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Custom webhook integrations',
    icon: '🔔',
    enabled: true,
  },
]

function IntegrationsPageContent() {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState<string | null>(null)

  const { data: webhooksData } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const response = await fetch('/api/webhooks', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch webhooks')
      return response.json()
    },
  })

  const webhooks = webhooksData?.webhooks || []
  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/receive` : ''

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Connect PayAid with third-party services and automation platforms
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <CardTitle>{integration.name}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </div>
                </div>
                {integration.enabled ? (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Available
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                    Coming Soon
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {integration.id === 'webhooks' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Webhook URL</label>
                    <div className="flex gap-2">
                      <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(webhookUrl, 'webhook-url')}
                      >
                        {copied === 'webhook-url' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use this URL to receive webhook events from PayAid
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Available Events</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• contact.created</li>
                      <li>• contact.updated</li>
                      <li>• deal.won</li>
                      <li>• invoice.created</li>
                      <li>• workflow.executed</li>
                    </ul>
                  </div>
                </div>
              )}
              {integration.id === 'zapier' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Zapier integration allows you to connect PayAid with thousands of apps.
                    Create automated workflows (Zaps) that trigger actions in other apps when
                    events happen in PayAid.
                  </p>
                  <Button disabled variant="outline">
                    Setup Guide (Coming Soon)
                  </Button>
                </div>
              )}
              {integration.id === 'make' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Make.com (formerly Integromat) provides powerful automation capabilities.
                    Build complex scenarios that connect PayAid with your favorite apps.
                  </p>
                  <Button disabled variant="outline">
                    Setup Guide (Coming Soon)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Management</CardTitle>
          <CardDescription>Manage your webhook endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          {webhooks.length > 0 ? (
            <div className="space-y-3">
              {webhooks.map((webhook: any) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{webhook.url}</div>
                    <div className="text-sm text-gray-500">
                      Events: {webhook.events?.join(', ') || 'All'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        webhook.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No webhooks configured</p>
              <p className="text-sm mt-2">
                Use the webhook API to create webhook endpoints for third-party integrations
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function IntegrationsPage() {
  return <IntegrationsPageContent />
}

