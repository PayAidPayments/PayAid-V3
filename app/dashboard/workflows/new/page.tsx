'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'

interface WorkflowStep {
  id: string
  type: 'condition' | 'action' | 'delay' | 'webhook' | 'email' | 'sms'
  config: any
}

const STEP_TYPES = [
  { value: 'condition', label: 'Condition', icon: '🔀' },
  { value: 'action', label: 'Action', icon: '⚡' },
  { value: 'delay', label: 'Delay', icon: '⏱️' },
  { value: 'webhook', label: 'Webhook', icon: '🔗' },
  { value: 'email', label: 'Send Email', icon: '📧' },
  { value: 'sms', label: 'Send SMS', icon: '💬' },
]

export default function NewWorkflowPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState<'EVENT' | 'SCHEDULE' | 'MANUAL'>('MANUAL')
  const [triggerEvent, setTriggerEvent] = useState('')
  const [triggerSchedule, setTriggerSchedule] = useState('')
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [draggedStep, setDraggedStep] = useState<string | null>(null)

  const createWorkflow = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create workflow')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/dashboard/workflows/${data.workflow.id}`)
    },
  })

  const addStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      config: {},
    }
    setSteps([...steps, newStep])
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id))
  }

  const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const handleDragStart = (id: string) => {
    setDraggedStep(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (!draggedStep) return

    const draggedIndex = steps.findIndex((s) => s.id === draggedStep)
    if (draggedIndex === -1) return

    const newSteps = [...steps]
    const [removed] = newSteps.splice(draggedIndex, 1)
    newSteps.splice(targetIndex, 0, removed)
    setSteps(newSteps)
    setDraggedStep(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || steps.length === 0) {
      alert('Please provide a name and at least one step')
      return
    }

    if (triggerType === 'EVENT' && !triggerEvent) {
      alert('Please provide a trigger event')
      return
    }

    if (triggerType === 'SCHEDULE' && !triggerSchedule) {
      alert('Please provide a schedule (cron expression)')
      return
    }

    createWorkflow.mutate({
      name,
      description,
      triggerType,
      triggerEvent: triggerType === 'EVENT' ? triggerEvent : undefined,
      triggerSchedule: triggerType === 'SCHEDULE' ? triggerSchedule : undefined,
      steps,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/workflows">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Workflow</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Build your automation workflow step by step
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Set up your workflow name and trigger</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Workflow Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Auto-assign leads"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this workflow does"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trigger Type *</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="MANUAL">Manual (Run on demand)</option>
                <option value="EVENT">Event-based (Triggered by system events)</option>
                <option value="SCHEDULE">Scheduled (Run on a schedule)</option>
              </select>
            </div>
            {triggerType === 'EVENT' && (
              <div>
                <label className="block text-sm font-medium mb-1">Trigger Event *</label>
                <Input
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  placeholder="e.g., contact.created, deal.won"
                  required
                />
              </div>
            )}
            {triggerType === 'SCHEDULE' && (
              <div>
                <label className="block text-sm font-medium mb-1">Schedule (Cron) *</label>
                <Input
                  value={triggerSchedule}
                  onChange={(e) => setTriggerSchedule(e.target.value)}
                  placeholder="e.g., 0 9 * * * (9 AM daily)"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use cron expression format (minute hour day month weekday)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Steps</CardTitle>
            <CardDescription>Add and configure workflow steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {STEP_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant="outline"
                  onClick={() => addStep(type.value as WorkflowStep['type'])}
                  className="flex items-center gap-2"
                >
                  <span>{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  draggable
                  onDragStart={() => handleDragStart(step.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-gray-400 mt-1 cursor-move" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          Step {index + 1}: {STEP_TYPES.find((t) => t.value === step.type)?.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {step.type === 'condition' && (
                          <Input
                            placeholder="Condition logic (e.g., contact.status === 'active')"
                            value={step.config.condition || ''}
                            onChange={(e) =>
                              updateStep(step.id, {
                                config: { ...step.config, condition: e.target.value },
                              })
                            }
                          />
                        )}
                        {step.type === 'delay' && (
                          <Input
                            type="number"
                            placeholder="Delay in seconds"
                            value={step.config.delay || ''}
                            onChange={(e) =>
                              updateStep(step.id, {
                                config: { ...step.config, delay: parseInt(e.target.value) || 0 },
                              })
                            }
                          />
                        )}
                        {step.type === 'email' && (
                          <div className="space-y-2">
                            <Input
                              placeholder="To email"
                              value={step.config.to || ''}
                              onChange={(e) =>
                                updateStep(step.id, {
                                  config: { ...step.config, to: e.target.value },
                                })
                              }
                            />
                            <Input
                              placeholder="Subject"
                              value={step.config.subject || ''}
                              onChange={(e) =>
                                updateStep(step.id, {
                                  config: { ...step.config, subject: e.target.value },
                                })
                              }
                            />
                          </div>
                        )}
                        {step.type === 'webhook' && (
                          <Input
                            placeholder="Webhook URL"
                            value={step.config.url || ''}
                            onChange={(e) =>
                              updateStep(step.id, {
                                config: { ...step.config, url: e.target.value },
                              })
                            }
                          />
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStep(step.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {steps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No steps added yet. Click buttons above to add steps.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={createWorkflow.isPending}>
            {createWorkflow.isPending ? 'Creating...' : 'Create Workflow'}
          </Button>
          <Link href="/dashboard/workflows">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}

