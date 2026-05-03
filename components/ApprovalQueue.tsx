'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import { getRiskColor } from '@/lib/ai/decision-risk-client'

const PAYAID_PURPLE = '#53328A'

interface ApprovalQueueItem {
  id: string
  decisionId: string
  decision: {
    id: string
    type: string
    description: string
    riskScore: number
    approvalLevel: string
    confidenceScore: number | null
    reasoningChain: string
    createdAt: string
  }
  requiredApprovers: string[]
  approvedBy: string[]
  rejectedBy: string[]
  expiresAt: string
  priority: number
  createdAt: string
}

export function ApprovalQueue() {
  const { token } = useAuthStore()
  const [queueItems, setQueueItems] = useState<ApprovalQueueItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchApprovalQueue()
  }, [])

  const fetchApprovalQueue = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/decisions?status=pending', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch approval queue')
      }

      const data = await response.json()
      if (data.success) {
        // Filter decisions that have approval queues
        const itemsWithQueue = data.decisions
          .filter((d: any) => d.approvalQueue)
          .map((d: any) => ({
            ...d.approvalQueue,
            decision: d,
          }))
        setQueueItems(itemsWithQueue)
      }
    } catch (error) {
      console.error('Failed to fetch approval queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (decisionId: string) => {
    try {
      const response = await fetch(`/api/ai/decisions/${decisionId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (response.ok) {
        fetchApprovalQueue()
      }
    } catch (error) {
      console.error('Failed to approve decision:', error)
    }
  }

  const handleReject = async (decisionId: string) => {
    try {
      const response = await fetch(`/api/ai/decisions/${decisionId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (response.ok) {
        fetchApprovalQueue()
      }
    } catch (error) {
      console.error('Failed to reject decision:', error)
    }
  }

  // Sort by priority and expiration
  const sortedQueue = [...queueItems].sort((a, b) => {
    // First by expiration (expiring soon first)
    const aExpired = new Date(a.expiresAt) < new Date()
    const bExpired = new Date(b.expiresAt) < new Date()
    if (aExpired !== bExpired) return aExpired ? -1 : 1

    // Then by priority (higher first)
    if (a.priority !== b.priority) return b.priority - a.priority

    // Then by creation date (newer first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  if (loading && queueItems.length === 0) {
    return <DashboardLoading message="Loading approval queue..." />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Approval Queue</CardTitle>
            <CardDescription>Decisions awaiting your approval</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchApprovalQueue}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedQueue.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <p className="text-gray-600">No pending approvals</p>
            <p className="text-sm text-gray-500 mt-2">All decisions have been processed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedQueue.map((item) => {
              const isExpired = new Date(item.expiresAt) < new Date()
              const approvalProgress =
                item.requiredApprovers.length > 0
                  ? (item.approvedBy.length / item.requiredApprovers.length) * 100
                  : 0
              const allApproved = item.approvedBy.length >= item.requiredApprovers.length

              return (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg ${
                    isExpired
                      ? 'bg-red-50 border-red-200'
                      : allApproved
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  } transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          className={`bg-${getRiskColor(item.decision.riskScore)}-100 text-${getRiskColor(item.decision.riskScore)}-800`}
                        >
                          Risk: {item.decision.riskScore}/100
                        </Badge>
                        <Badge variant="outline">
                          {item.decision.approvalLevel.replace(/_/g, ' ')}
                        </Badge>
                        {isExpired && (
                          <Badge className="bg-red-100 text-red-800">Expired</Badge>
                        )}
                        {allApproved && (
                          <Badge className="bg-green-100 text-green-800">All Approved</Badge>
                        )}
                        {item.decision.confidenceScore && (
                          <Badge variant="outline">
                            {(item.decision.confidenceScore * 100).toFixed(0)}% confidence
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-semibold mb-1">
                        {item.decision.type.replace(/_/g, ' ').toUpperCase()}
                      </h4>
                      <p className="text-sm text-gray-700 mb-2">{item.decision.description}</p>

                      {/* Approval Progress */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>
                            Approvals: {item.approvedBy.length} / {item.requiredApprovers.length}
                          </span>
                          <span>
                            Expires: {format(new Date(item.expiresAt), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${approvalProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Reasoning */}
                      {item.decision.reasoningChain && (
                        <details className="mt-2">
                          <summary className="text-sm text-blue-600 cursor-pointer">
                            View reasoning
                          </summary>
                          <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded">
                            {item.decision.reasoningChain}
                          </p>
                        </details>
                      )}

                      {isExpired && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          This approval request has expired
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!allApproved && !isExpired && (
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item.decisionId)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(item.decisionId)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
