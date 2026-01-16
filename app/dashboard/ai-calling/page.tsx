'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'
import { Phone, Plus, Settings, BarChart3 } from 'lucide-react'

interface AICallingBot {
  id: string
  name: string
  phoneNumber: string
  greeting?: string
  faqKnowledgeBase: Array<{ question: string; answer: string }>
  isActive: boolean
  createdAt: string
}

export default function AICallingPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    greeting: '',
  })

  const { data, isLoading, refetch } = useQuery<{ bots: AICallingBot[] }>({
    queryKey: ['ai-calling-bots'],
    queryFn: async () => {
      const response = await fetch('/api/ai-calling')
      if (!response.ok) throw new Error('Failed to fetch AI calling bots')
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/ai-calling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          greeting: data.greeting || 'Hello! Thank you for calling. How can I help you today?',
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create AI calling bot')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
      setShowCreateModal(false)
      setFormData({ name: '', phoneNumber: '', greeting: '' })
    },
  })

  const bots = data?.bots || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Calling Bots</h1>
          <p className="mt-2 text-gray-600">Automated phone answering with AI intent recognition</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Bot
        </Button>
      </div>

      {isLoading ? (
        <PageLoading message="Loading AI calling bots..." fullScreen={false} />
      ) : bots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No AI calling bots created yet</p>
            <Button onClick={() => setShowCreateModal(true)}>Create Your First Bot</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <Card key={bot.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{bot.name}</CardTitle>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bot.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {bot.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <CardDescription>
                  <Phone className="h-4 w-4 inline mr-1" />
                  {bot.phoneNumber}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bot.greeting && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Greeting:</p>
                      <p className="text-sm text-gray-700">{bot.greeting}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">FAQ Knowledge Base:</p>
                    <p className="text-sm text-gray-700">
                      {Array.isArray(bot.faqKnowledgeBase)
                        ? `${bot.faqKnowledgeBase.length} questions`
                        : '0 questions'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/ai-calling/${bot.id}/settings`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                    <Link href={`/dashboard/ai-calling/${bot.id}/analytics`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Bot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create AI Calling Bot</CardTitle>
              <CardDescription>Set up automated phone answering</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  createMutation.mutate(formData)
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bot Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Customer Support Bot"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number *</label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="e.g., +1234567890"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Twilio phone number for receiving calls
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Greeting Message</label>
                  <Input
                    value={formData.greeting}
                    onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                    placeholder="Hello! How can I help you?"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Bot'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

