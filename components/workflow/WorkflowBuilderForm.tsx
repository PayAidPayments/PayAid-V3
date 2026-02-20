'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Zap, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { WorkflowStep, WorkflowEventValue, ActionTypeValue } from '@/lib/workflow/types'

const TRIGGER_TYPES = [
  { value: 'EVENT', label: 'When something happens' },
  { value: 'SCHEDULE', label: 'On a schedule' },
  { value: 'MANUAL', label: 'Manual run only' },
]

const EVENTS: { value: WorkflowEventValue; label: string }[] = [
  { value: 'contact.created', label: 'New contact created' },
  { value: 'contact.updated', label: 'Contact updated' },
  { value: 'deal.created', label: 'New deal created' },
  { value: 'deal.stage_changed', label: 'Deal stage changed' },
  { value: 'lead.created', label: 'New lead created' },
  { value: 'form.submitted', label: 'Form submitted' },
  { value: 'invoice.created', label: 'Invoice created' },
  { value: 'invoice.overdue', label: 'Invoice overdue' },
  { value: 'task.created', label: 'Task created' },
  { value: 'order.created', label: 'Order created' },
]

const ACTION_TYPES: { value: ActionTypeValue; label: string }[] = [
  { value: 'send_email', label: 'Send email' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'send_whatsapp', label: 'Send WhatsApp' },
  { value: 'create_task', label: 'Create task' },
  { value: 'update_contact', label: 'Update contact' },
  { value: 'add_note', label: 'Add note' },
  { value: 'webhook', label: 'Call webhook' },
]

function generateStepId() {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

interface WorkflowBuilderFormProps {
  workflowId?: string
  initial?: {
    name: string
    description?: string | null
    triggerType: string
    triggerEvent?: string | null
    triggerSchedule?: string | null
    isActive?: boolean
    steps: WorkflowStep[]
  }
  onSaved: (id?: string) => void
  onCancel: () => void
}

export function WorkflowBuilderForm({
  workflowId,
  initial,
  onSaved,
  onCancel,
}: WorkflowBuilderFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [triggerType, setTriggerType] = useState<string>(initial?.triggerType ?? 'EVENT')
  const [triggerEvent, setTriggerEvent] = useState<string>(initial?.triggerEvent ?? 'contact.created')
  const [triggerSchedule, setTriggerSchedule] = useState(initial?.triggerSchedule ?? '0 9 * * 1-5')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [steps, setSteps] = useState<WorkflowStep[]>(
    initial?.steps?.length
      ? initial.steps.map((s, i) => ({ ...s, order: i }))
      : []
  )

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = workflowId ? `/api/workflows/${workflowId}` : '/api/workflows'
      const method = workflowId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Save failed')
      }
      return res.json()
    },
    onSuccess: (data) => {
      onSaved(data.workflow?.id)
    },
  })

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: generateStepId(),
        type: 'send_email',
        order: prev.length,
        config: { subject: '', body: '', to: '{{contact.email}}' },
      },
    ])
  }

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })))
  }

  const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }

  const updateStepConfig = (id: string, key: string, value: unknown) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, config: { ...s.config, [key]: value } } : s
      )
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Enter a workflow name')
      return
    }
    if (triggerType === 'EVENT' && !triggerEvent) {
      alert('Select an event')
      return
    }
    saveMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      triggerType,
      triggerEvent: triggerType === 'EVENT' ? triggerEvent : undefined,
      triggerSchedule: triggerType === 'SCHEDULE' ? triggerSchedule : undefined,
      isActive,
      steps: steps.map((s, i) => ({ ...s, order: i })),
    })
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/workflows">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="h-6 w-6 text-purple-600" />
          {workflowId ? 'Edit workflow' : 'New workflow'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Name and when the workflow runs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Welcome new lead"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this workflow does"
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label>Trigger</Label>
              <Select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="mt-1"
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            {triggerType === 'EVENT' && (
              <div>
                <Label>Event</Label>
                <Select
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  className="mt-1"
                >
                  {EVENTS.map((ev) => (
                    <option key={ev.value} value={ev.value}>
                      {ev.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {triggerType === 'SCHEDULE' && (
              <div>
                <Label htmlFor="cron">Cron expression</Label>
                <Input
                  id="cron"
                  value={triggerSchedule}
                  onChange={(e) => setTriggerSchedule(e.target.value)}
                  placeholder="0 9 * * 1-5"
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: 0 9 * * 1-5 = 9:00 AM Mon–Fri
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active (workflow runs when triggered)</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Steps to run when the workflow is triggered</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, index) => (
              <StepEditor
                key={step.id}
                step={step}
                index={index}
                onTypeChange={(type) => updateStep(step.id, { type, config: getDefaultConfig(type) })}
                onConfigChange={(key, value) => updateStepConfig(step.id, key, value)}
                onRemove={() => removeStep(step.id)}
              />
            ))}
            <Button type="button" variant="outline" onClick={addStep} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add action
            </Button>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : workflowId ? 'Update workflow' : 'Create workflow'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

function getDefaultConfig(type: ActionTypeValue): Record<string, unknown> {
  switch (type) {
    case 'send_email':
      return { to: '{{contact.email}}', subject: '', body: '' }
    case 'send_sms':
    case 'send_whatsapp':
      return { to: '{{contact.phone}}', body: '' }
    case 'create_task':
      return { title: '', dueInDays: 7, assignTo: '' }
    case 'update_contact':
      return { field: 'notes', value: '' }
    case 'add_note':
      return { body: '', userId: '' }
    case 'webhook':
      return { url: '', method: 'POST', body: '{}' }
    default:
      return {}
  }
}

function StepEditor({
  step,
  index,
  onTypeChange,
  onConfigChange,
  onRemove,
}: {
  step: WorkflowStep
  index: number
  onTypeChange: (type: ActionTypeValue) => void
  onConfigChange: (key: string, value: unknown) => void
  onRemove: () => void
}) {
  const actionLabel = ACTION_TYPES.find((a) => a.value === step.type)?.label ?? step.type
  const config = step.config || {}

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Step {index + 1}: {actionLabel}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div>
        <Label className="text-xs">Action type</Label>
        <Select
          value={step.type}
          onChange={(e) => onTypeChange(e.target.value as ActionTypeValue)}
          className="mt-1"
        >
          {ACTION_TYPES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </Select>
      </div>
      {step.type === 'send_email' && (
        <>
          <div>
            <Label className="text-xs">To (e.g. {`{{contact.email}}`})</Label>
            <Input
              value={(config.to as string) ?? ''}
              onChange={(e) => onConfigChange('to', e.target.value)}
              placeholder="{{contact.email}}"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Subject</Label>
            <Input
              value={(config.subject as string) ?? ''}
              onChange={(e) => onConfigChange('subject', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Body</Label>
            <Textarea
              value={(config.body as string) ?? ''}
              onChange={(e) => onConfigChange('body', e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </>
      )}
      {(step.type === 'send_sms' || step.type === 'send_whatsapp') && (
        <>
          <div>
            <Label className="text-xs">To (e.g. {`{{contact.phone}}`})</Label>
            <Input
              value={(config.to as string) ?? ''}
              onChange={(e) => onConfigChange('to', e.target.value)}
              placeholder="{{contact.phone}}"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea
              value={(config.body as string) ?? ''}
              onChange={(e) => onConfigChange('body', e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
        </>
      )}
      {step.type === 'create_task' && (
        <>
          <div>
            <Label className="text-xs">Task title</Label>
            <Input
              value={(config.title as string) ?? ''}
              onChange={(e) => onConfigChange('title', e.target.value)}
              placeholder="Follow up with contact"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Due in (days)</Label>
            <Input
              type="number"
              value={(config.dueInDays as number) ?? 7}
              onChange={(e) => onConfigChange('dueInDays', parseInt(e.target.value, 10) || 0)}
              className="mt-1"
            />
          </div>
        </>
      )}
      {step.type === 'update_contact' && (
        <>
          <div>
            <Label className="text-xs">Field name</Label>
            <Input
              value={(config.field as string) ?? 'notes'}
              onChange={(e) => onConfigChange('field', e.target.value)}
              placeholder="notes"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Value</Label>
            <Input
              value={(config.value as string) ?? ''}
              onChange={(e) => onConfigChange('value', e.target.value)}
              className="mt-1"
            />
          </div>
        </>
      )}
      {step.type === 'add_note' && (
        <div>
          <Label className="text-xs">Note text</Label>
          <Textarea
            value={(config.body as string) ?? ''}
            onChange={(e) => onConfigChange('body', e.target.value)}
            className="mt-1"
            rows={2}
          />
        </div>
      )}
      {step.type === 'webhook' && (
        <>
          <div>
            <Label className="text-xs">URL</Label>
            <Input
              value={(config.url as string) ?? ''}
              onChange={(e) => onConfigChange('url', e.target.value)}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Method</Label>
            <Select
              value={(config.method as string) ?? 'POST'}
              onChange={(e) => onConfigChange('method', e.target.value)}
              className="mt-1"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Body (JSON, optional)</Label>
            <Textarea
              value={
                typeof config.body === 'string'
                  ? config.body
                  : JSON.stringify(config.body || {}, null, 2)
              }
              onChange={(e) => onConfigChange('body', e.target.value)}
              className="mt-1 font-mono text-sm"
              rows={3}
              placeholder='{"key": "value"}'
            />
          </div>
        </>
      )}
    </div>
  )
}
