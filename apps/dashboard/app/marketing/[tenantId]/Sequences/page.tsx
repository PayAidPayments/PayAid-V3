'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Mail, 
  MessageSquare, 
  Phone, 
  Calendar, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  Users,
  BarChart3,
  ArrowRight,
  Clock
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

interface SequenceStep {
  id: string
  order: number
  channel: 'email' | 'whatsapp' | 'sms'
  delayDays: number
  subject?: string
  content: string
  templateId?: string
}

interface Sequence {
  id: string
  name: string
  description: string
  steps: SequenceStep[]
  status: 'active' | 'paused' | 'draft'
  enrolledCount: number
  completedCount: number
  createdAt: string
}

export default function SequencesPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null)
  const [newSequence, setNewSequence] = useState({
    name: '',
    description: '',
    steps: [] as SequenceStep[],
  })

  useEffect(() => {
    fetchSequences()
  }, [tenantId, token])

  const fetchSequences = async () => {
    try {
      setLoading(true)
      if (!token) return

      const response = await fetch('/api/marketing/sequences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSequences(data.sequences || [])
      } else {
        // For now, use empty array if API doesn't exist
        setSequences([])
      }
    } catch (error) {
      console.error('Error fetching sequences:', error)
      setSequences([])
    } finally {
      setLoading(false)
    }
  }

  const addStep = () => {
    setNewSequence({
      ...newSequence,
      steps: [
        ...newSequence.steps,
        {
          id: `step-${Date.now()}`,
          order: newSequence.steps.length + 1,
          channel: 'email',
          delayDays: newSequence.steps.length * 3, // Default: 3 days between steps
          content: '',
        },
      ],
    })
  }

  const removeStep = (stepId: string) => {
    setNewSequence({
      ...newSequence,
      steps: newSequence.steps.filter(s => s.id !== stepId).map((s, idx) => ({
        ...s,
        order: idx + 1,
      })),
    })
  }

  const updateStep = (stepId: string, updates: Partial<SequenceStep>) => {
    setNewSequence({
      ...newSequence,
      steps: newSequence.steps.map(s =>
        s.id === stepId ? { ...s, ...updates } : s
      ),
    })
  }

  const handleSaveSequence = async () => {
    if (!newSequence.name.trim() || newSequence.steps.length === 0) {
      alert('Please provide a name and at least one step')
      return
    }

    try {
      const response = await fetch('/api/marketing/sequences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newSequence),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewSequence({ name: '', description: '', steps: [] })
        fetchSequences()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create sequence')
      }
    } catch (error) {
      console.error('Error creating sequence:', error)
      alert('Failed to create sequence')
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return Mail
      case 'whatsapp':
        return MessageSquare
      case 'sms':
        return Phone
      default:
        return Mail
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'whatsapp':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'sms':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return <PageLoading message="Loading sequences..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Multi-Channel Sequences</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create unified sequences across email, WhatsApp, and SMS
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Sequence
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sequences</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {sequences.length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {sequences.filter(s => s.status === 'active').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {sequences.reduce((sum, s) => sum + s.enrolledCount, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {sequences.reduce((sum, s) => sum + s.completedCount, 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sequences List */}
      {sequences.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sequences.map((sequence) => (
            <Card key={sequence.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{sequence.name}</CardTitle>
                    <CardDescription className="mt-1">{sequence.description}</CardDescription>
                  </div>
                  <Badge
                    className={
                      sequence.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : sequence.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }
                  >
                    {sequence.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Steps ({sequence.steps.length}):
                  </p>
                  <div className="space-y-2">
                    {sequence.steps.slice(0, 3).map((step) => {
                      const Icon = getChannelIcon(step.channel)
                      return (
                        <div
                          key={step.id}
                          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <div className={`p-1.5 rounded ${getChannelColor(step.channel)}`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <span>Day {step.delayDays}</span>
                          <span className="text-gray-400">•</span>
                          <span className="capitalize">{step.channel}</span>
                        </div>
                      )
                    })}
                    {sequence.steps.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{sequence.steps.length - 3} more steps
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>{sequence.enrolledCount} enrolled</p>
                    <p>{sequence.completedCount} completed</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSequence(sequence)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Toggle pause/play
                        // Implementation needed
                      }}
                    >
                      {sequence.status === 'active' ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No sequences created yet. Create your first multi-channel sequence to get started.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Sequence
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Multi-Channel Sequence</CardTitle>
              <CardDescription>
                Build a sequence that sends messages across email, WhatsApp, and SMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sequence Name
                </label>
                <Input
                  value={newSequence.name}
                  onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
                  placeholder="e.g., Welcome Series, Re-engagement Campaign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <Input
                  value={newSequence.description}
                  onChange={(e) => setNewSequence({ ...newSequence, description: e.target.value })}
                  placeholder="Brief description of this sequence"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sequence Steps
                  </label>
                  <Button variant="outline" size="sm" onClick={addStep}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Step
                  </Button>
                </div>

                <div className="space-y-4">
                  {newSequence.steps.map((step, index) => {
                    const Icon = getChannelIcon(step.channel)
                    return (
                      <Card key={step.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded ${getChannelColor(step.channel)}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-semibold">Step {step.order}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(step.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Channel
                            </label>
                            <select
                              value={step.channel}
                              onChange={(e) =>
                                updateStep(step.id, {
                                  channel: e.target.value as 'email' | 'whatsapp' | 'sms',
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                            >
                              <option value="email">Email</option>
                              <option value="whatsapp">WhatsApp</option>
                              <option value="sms">SMS</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Delay (Days)
                            </label>
                            <Input
                              type="number"
                              value={step.delayDays}
                              onChange={(e) =>
                                updateStep(step.id, { delayDays: parseInt(e.target.value) || 0 })
                              }
                              min="0"
                            />
                          </div>
                        </div>

                        {step.channel === 'email' && (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Subject
                            </label>
                            <Input
                              value={step.subject || ''}
                              onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                              placeholder="Email subject line"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Message Content
                          </label>
                          <textarea
                            value={step.content}
                            onChange={(e) => updateStep(step.id, { content: e.target.value })}
                            placeholder={
                              step.channel === 'email'
                                ? 'Email body content...'
                                : step.channel === 'whatsapp'
                                ? 'WhatsApp message...'
                                : 'SMS message...'
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm min-h-[100px]"
                          />
                        </div>
                      </Card>
                    )
                  })}
                </div>

                {newSequence.steps.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                      No steps added yet. Click &quot;Add Step&quot; to create your first message.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewSequence({ name: '', description: '', steps: [] })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSequence}
                  disabled={!newSequence.name.trim() || newSequence.steps.length === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Save Sequence
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
