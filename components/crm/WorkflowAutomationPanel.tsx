'use client'

import { useState } from 'react'
import { Zap, Play, Pause, Settings, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Automation {
  id: string
  name: string
  description: string
  trigger: string
  actions: string[]
  status: 'active' | 'paused' | 'draft'
  executions: number
  lastRun?: Date
}

interface WorkflowAutomationPanelProps {
  tenantId: string
}

export function WorkflowAutomationPanel({ tenantId }: WorkflowAutomationPanelProps) {
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: '1',
      name: 'Auto-assign Lead',
      description: 'Automatically assign new leads to available sales reps',
      trigger: 'New lead created',
      actions: ['Assign to round-robin', 'Send welcome email'],
      status: 'active',
      executions: 145,
      lastRun: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: '2',
      name: 'Payment Reminder',
      description: 'Send reminder emails for overdue invoices',
      trigger: 'Invoice overdue by 7 days',
      actions: ['Send email reminder', 'Create follow-up task'],
      status: 'active',
      executions: 23,
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '3',
      name: 'Deal Stage Update',
      description: 'Update deal probability when stage changes',
      trigger: 'Deal stage changed',
      actions: ['Update probability', 'Notify owner'],
      status: 'paused',
      executions: 67,
      lastRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ])
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const toggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => 
      a.id === id 
        ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
        : a
    ))
  }

  return (
    <>
      <GlassCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Workflow Automations</CardTitle>
              <CardDescription>Automate repetitive tasks and workflows</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Automation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {automation.name}
                      </h4>
                      <Badge 
                        variant={automation.status === 'active' ? 'default' : 'secondary'}
                      >
                        {automation.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {automation.description}
                    </p>
                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <p><span className="font-medium">Trigger:</span> {automation.trigger}</p>
                      <p><span className="font-medium">Actions:</span> {automation.actions.join(', ')}</p>
                      <p>
                        <span className="font-medium">Executions:</span> {automation.executions} times
                        {automation.lastRun && (
                          <span className="ml-2">
                            • Last run: {new Date(automation.lastRun).toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAutomation(automation.id)}
                    >
                      {automation.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {automations.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No automations configured</p>
                <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                  Create Your First Automation
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </GlassCard>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Automation</DialogTitle>
            <DialogDescription>
              Set up a new workflow automation to automate repetitive tasks
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Automation builder will be implemented here. This will allow users to:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-gray-500 space-y-1">
              <li>Select triggers (e.g., "New lead created", "Invoice overdue")</li>
              <li>Define conditions (optional)</li>
              <li>Choose actions (e.g., "Send email", "Create task", "Update field")</li>
              <li>Test and activate the automation</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Navigate to automation builder
              setShowCreateDialog(false)
            }}>
              Open Automation Builder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
