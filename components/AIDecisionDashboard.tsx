'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Undo2,
  Eye
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import { getRiskColor, getRiskCategory } from '@/lib/ai/decision-risk-client'

const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'

interface AIDecision {
  id: string
  type: string
  description: string
  riskScore: number
  approvalLevel: string
  status: string
  confidenceScore: number | null
  reasoningChain: string
  createdAt: string
  executedAt: string | null
  approvedBy: string | null
  rollbackable: boolean
  executionResult: any
  approvalQueue?: {
    requiredApprovers: string[]
    approvedBy: string[]
    rejectedBy: string[]
    expiresAt: string
  }
}

export function AIDecisionDashboard() {
  const { token } = useAuthStore()
  const [decisions, setDecisions] = useState<AIDecision[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'executed' | 'rejected'>('all')

  useEffect(() => {
    fetchDecisions()
  }, [filter])

  const fetchDecisions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/ai/decisions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch decisions')
      }

      const data = await response.json()
      if (data.success) {
        setDecisions(data.decisions || [])
      }
    } catch (error) {
      console.error('Failed to fetch decisions:', error)
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
        fetchDecisions()
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
        fetchDecisions()
      }
    } catch (error) {
      console.error('Failed to reject decision:', error)
    }
  }

  const handleRollback = async (decisionId: string) => {
    if (!confirm('Are you sure you want to rollback this decision?')) return

    try {
      const response = await fetch(`/api/ai/decisions/${decisionId}/rollback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchDecisions()
      }
    } catch (error) {
      console.error('Failed to rollback decision:', error)
    }
  }

  // Calculate statistics
  const totalDecisions = decisions.length
  const pendingDecisions = decisions.filter((d) => d.status === 'pending').length
  const executedDecisions = decisions.filter((d) => d.status === 'executed').length
  const autoExecuted = decisions.filter(
    (d) => d.status === 'executed' && d.approvalLevel === 'AUTO_EXECUTE'
  ).length
  const approvalRate =
    totalDecisions > 0
      ? ((executedDecisions / totalDecisions) * 100).toFixed(1)
      : '0'

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      executed: { label: 'Executed', className: 'bg-green-100 text-green-800' },
      approved: { label: 'Approved', className: 'bg-blue-100 text-blue-800' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
      rolled_back: { label: 'Rolled Back', className: 'bg-gray-100 text-gray-800' },
    }
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  const getApprovalLevelBadge = (level: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      AUTO_EXECUTE: { label: 'Auto-Execute', className: 'bg-green-100 text-green-800' },
      AUDIT_LOG: { label: 'Audit Log', className: 'bg-blue-100 text-blue-800' },
      MANAGER_APPROVAL: { label: 'Manager', className: 'bg-orange-100 text-orange-800' },
      EXECUTIVE_APPROVAL: { label: 'Executive', className: 'bg-red-100 text-red-800' },
    }
    const badge = badges[level] || { label: level, className: 'bg-gray-100 text-gray-800' }
    return <Badge className={badge.className}>{badge.label}</Badge>
  }

  if (loading && decisions.length === 0) {
    return <DashboardLoading message="Loading AI decisions..." />
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {pendingDecisions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Require action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Executed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {autoExecuted}
            </div>
            <p className="text-xs text-muted-foreground mt-1">No human intervention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {approvalRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Of all decisions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Decisions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {totalDecisions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Decisions</CardTitle>
              <CardDescription>Automated decision execution and approval queue</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'executed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('executed')}
              >
                Executed
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('rejected')}
              >
                Rejected
              </Button>
              <Button variant="outline" size="sm" onClick={fetchDecisions}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {decisions.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No decisions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(decision.status)}
                        {getApprovalLevelBadge(decision.approvalLevel)}
                        <Badge
                          className={`bg-${getRiskColor(decision.riskScore)}-100 text-${getRiskColor(decision.riskScore)}-800`}
                        >
                          Risk: {decision.riskScore}/100
                        </Badge>
                        {decision.confidenceScore && (
                          <Badge variant="outline">
                            Confidence: {(decision.confidenceScore * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">
                        {decision.type.replace(/_/g, ' ').toUpperCase()}
                      </h4>
                      <p className="text-sm text-gray-700 mb-2">{decision.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(decision.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>

                      {/* Reasoning */}
                      {decision.reasoningChain && (
                        <details className="mt-2">
                          <summary className="text-sm text-blue-600 cursor-pointer">
                            View reasoning
                          </summary>
                          <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded">
                            {decision.reasoningChain}
                          </p>
                        </details>
                      )}

                      {/* Execution Result */}
                      {decision.executionResult && (
                        <details className="mt-2">
                          <summary className="text-sm text-green-600 cursor-pointer">
                            View execution result
                          </summary>
                          <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded">
                            {decision.executionResult.success ? (
                              <span className="text-green-600">✓ {decision.executionResult.message}</span>
                            ) : (
                              <span className="text-red-600">✗ {decision.executionResult.message}</span>
                            )}
                          </div>
                        </details>
                      )}

                      {/* Approval Queue Info */}
                      {decision.approvalQueue && decision.status === 'pending' && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <p className="text-yellow-800">
                            Requires {decision.approvalQueue.requiredApprovers.length} approval(s).{' '}
                            {decision.approvalQueue.approvedBy.length} approved.
                          </p>
                          {new Date(decision.approvalQueue.expiresAt) < new Date() && (
                            <p className="text-red-600 mt-1">⚠️ Approval expired</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {decision.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(decision.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(decision.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {decision.status === 'executed' && decision.rollbackable && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRollback(decision.id)}
                        >
                          <Undo2 className="h-4 w-4 mr-1" />
                          Rollback
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
