'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/stores/auth'

export default function NewCampaignPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const { token } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    subject: '',
    content: '',
    scheduledFor: '',
  })

  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create campaign')
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/marketing/${tenantId}/Campaigns/${data.campaign.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createCampaign.mutate({
      ...formData,
      scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor).toISOString() : undefined,
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Campaign</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create a new marketing campaign</p>
        </div>
        <Link href={`/marketing/${tenantId}/Campaigns`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Campaign Details</CardTitle>
            <CardDescription className="dark:text-gray-400">Enter the details for your marketing campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3"
                placeholder="Summer Sale Campaign"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3"
              >
                <option value="email">📧 Email</option>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="sms">📱 SMS</option>
              </select>
            </div>

            {formData.type === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3"
                  placeholder="Special Offer - 20% Off!"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content *</label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full h-32 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2"
                placeholder="Enter your campaign message..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to send immediately (draft status)
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={createCampaign.isPending} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
              </Button>
              <Link href={`/marketing/${tenantId}/Campaigns`}>
                <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
