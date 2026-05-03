'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, Play, Pause, Save, Trash2, Plus, GripVertical } from 'lucide-react'
import { format } from 'date-fns'

const STEP_TYPES = [
  { value: 'condition', label: 'Condition', icon: '🔀' },
  { value: 'action', label: 'Action', icon: '⚡' },
  { value: 'delay', label: 'Delay', icon: '⏱️' },
  { value: 'webhook', label: 'Webhook', icon: '🔗' },
  { value: 'email', label: 'Send Email', icon: '📧' },
  { value: 'sms', label: 'Send SMS', icon: '💬' },
]

export default function WorkflowDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const workflowId = params.id as string

  const { data, isLoading } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch workflow')
      return response.json()
    },
  })

  const updateWorkflow = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      })
      if (!response.ok) throw new Error('Failed to update workflow')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', workflowId] })
    },
  })

  const executeWorkflow = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to execute workflow')
      return response.json()
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const workflow = data?.workflow
  if (!workflow) {
    return <div>Workflow not found</div>
  }

  const steps = (workflow.steps as any[]) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workflows">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{workflow.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {workflow.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => executeWorkflow.mutate()}
            disabled={executeWorkflow.isPending}
          >
            <Play className="h-4 w-4 mr-2" />
            {executeWorkflow.isPending ? 'Running...' : 'Run Now'}
          </Button>
          <Button
            variant={workflow.isActive ? 'default' : 'outline'}
            onClick={() =>
              updateWorkflow.mutate({ isActive: !workflow.isActive })
            }
          >
            {workflow.isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={workflow.name}
                onChange={(e) => updateWorkflow.mutate({ name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={workflow.description || ''}
                onChange={(e) => updateWorkflow.mutate({ description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trigger Type</label>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {workflow.triggerType}
              </div>
            </div>
            {workflow.triggerEvent && (
              <div>
                <label className="block text-sm font-medium mb-1">Trigger Event</label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {workflow.triggerEvent}
                </div>
              </div>
            )}
            {workflow.triggerSchedule && (
              <div>
                <label className="block text-sm font-medium mb-1">Schedule</label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {workflow.triggerSchedule}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${workflow.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                />
                <span className="text-sm">
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Steps</CardTitle>
            <CardDescription>{steps.length} steps configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {steps.map((step: any, index: number) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">
                      Step {index + 1}: {STEP_TYPES.find((t) => t.value === step.type)?.label || step.type}
                    </span>
                  </div>
                  {step.config && Object.keys(step.config).length > 0 && (
                    <div className="text-xs text-gray-500 mt-1 ml-6">
                      {JSON.stringify(step.config, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>Recent workflow executions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            Execution history will be displayed here. Check the API endpoint for execution details.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

