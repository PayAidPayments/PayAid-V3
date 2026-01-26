'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, User } from 'lucide-react'
import { format } from 'date-fns'

interface ApprovalStep {
  approverId: string
  approverName: string
  approverEmail: string
  order: number
}

interface QuoteApprovalWorkflowProps {
  quoteId: string
  tenantId: string
  requiresApproval: boolean
  currentApprovals?: Array<{
    id: string
    approverName: string
    approverEmail: string
    approvalOrder: number
    status: string
    comments?: string
    approvedAt?: string
    rejectedAt?: string
  }>
}

export function QuoteApprovalWorkflow({
  quoteId,
  tenantId,
  requiresApproval,
  currentApprovals = [],
}: QuoteApprovalWorkflowProps) {
  const [workflowSteps, setWorkflowSteps] = useState<ApprovalStep[]>([])
  const [newApprover, setNewApprover] = useState({
    name: '',
    email: '',
  })

  // Fetch users for approver selection
  const { data: usersData } = useQuery({
    queryKey: ['users', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/users?tenantId=${tenantId}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    },
  })

  // Create approval workflow
  const createWorkflow = useMutation({
    mutationFn: async (steps: ApprovalStep[]) => {
      const response = await fetch(`/api/quotes/${quoteId}/approval-workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: steps,
        }),
      })
      if (!response.ok) throw new Error('Failed to create approval workflow')
      return response.json()
    },
  })

  // Approve/Reject quote
  const handleApproval = useMutation({
    mutationFn: async ({ action, comments }: { action: 'approve' | 'reject'; comments?: string }) => {
      const response = await fetch(`/api/quotes/${quoteId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          comments,
        }),
      })
      if (!response.ok) throw new Error(`Failed to ${action} quote`)
      return response.json()
    },
  })

  const addApprover = () => {
    if (!newApprover.name || !newApprover.email) return
    setWorkflowSteps([
      ...workflowSteps,
      {
        approverId: `temp-${Date.now()}`,
        approverName: newApprover.name,
        approverEmail: newApprover.email,
        order: workflowSteps.length + 1,
      },
    ])
    setNewApprover({ name: '', email: '' })
  }

  const removeApprover = (index: number) => {
    setWorkflowSteps(workflowSteps.filter((_, i) => i !== index))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
    }
    return variants[status] || 'bg-gray-100 text-gray-800'
  }

  if (!requiresApproval) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approval Workflow</CardTitle>
          <CardDescription>This quote does not require approval</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Workflow</CardTitle>
        <CardDescription>Manage the approval process for this quote</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Approvals */}
        {currentApprovals.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Approval Status</h3>
            {currentApprovals
              .sort((a, b) => a.approvalOrder - b.approvalOrder)
              .map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(approval.status)}
                    <div>
                      <div className="font-medium">{approval.approverName}</div>
                      <div className="text-sm text-gray-500">{approval.approverEmail}</div>
                      {approval.comments && (
                        <div className="text-sm text-gray-600 mt-1">{approval.comments}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusBadge(approval.status)}>{approval.status}</Badge>
                    {approval.approvedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(approval.approvedAt), 'MMM dd, yyyy')}
                      </div>
                    )}
                    {approval.rejectedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(approval.rejectedAt), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Create Workflow */}
        {workflowSteps.length === 0 && currentApprovals.length === 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Create Approval Workflow</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="approver-name">Approver Name</Label>
                <Input
                  id="approver-name"
                  value={newApprover.name}
                  onChange={(e) => setNewApprover({ ...newApprover, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="approver-email">Approver Email</Label>
                <Input
                  id="approver-email"
                  type="email"
                  value={newApprover.email}
                  onChange={(e) => setNewApprover({ ...newApprover, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addApprover}>Add</Button>
              </div>
            </div>

            {workflowSteps.length > 0 && (
              <div className="space-y-2">
                {workflowSteps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {step.order}
                      </div>
                      <div>
                        <div className="font-medium">{step.approverName}</div>
                        <div className="text-sm text-gray-500">{step.approverEmail}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeApprover(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() => createWorkflow.mutate(workflowSteps)}
                  disabled={createWorkflow.isPending}
                  className="w-full"
                >
                  {createWorkflow.isPending ? 'Creating...' : 'Create Workflow'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Approval Actions (for current approver) */}
        {currentApprovals.some((a) => a.status === 'PENDING') && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Your Approval</h3>
            <Textarea
              placeholder="Add comments (optional)"
              id="approval-comments"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  handleApproval.mutate({
                    action: 'reject',
                    comments: (document.getElementById('approval-comments') as HTMLTextAreaElement)
                      ?.value,
                  })
                }
                disabled={handleApproval.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() =>
                  handleApproval.mutate({
                    action: 'approve',
                    comments: (document.getElementById('approval-comments') as HTMLTextAreaElement)
                      ?.value,
                  })
                }
                disabled={handleApproval.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
