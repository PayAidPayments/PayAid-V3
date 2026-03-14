'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { getAuthHeaders } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Execution {
  id: string
  status: string
  error: string | null
  startedAt: string
  completedAt: string | null
  result?: Array<{ stepId: string; success: boolean; error?: string }>
}

export default function WorkflowRunsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const { data: workflow } = useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const res = await fetch(`/api/workflows/${id}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Workflow not found')
      const json = await res.json()
      return json.workflow
    },
    enabled: !!id,
  })

  const { data: executionsData, isLoading } = useQuery({
    queryKey: ['workflow-executions', id],
    queryFn: async () => {
      const res = await fetch(`/api/workflows/${id}/executions?limit=50`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error('Failed to load runs')
      const json = await res.json()
      return json.executions as Execution[]
    },
    enabled: !!id,
  })

  const executions = executionsData || []

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/workflows">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-xl font-bold text-gray-900">
          Runs: {workflow?.name ?? '…'}
        </h1>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading runs…
          </CardContent>
        </Card>
      ) : executions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No runs yet</CardTitle>
            <CardContent className="pt-2 text-gray-500">
              This workflow has not been run. Use &quot;Run now&quot; on the workflows list or wait for the trigger (event or schedule).
            </CardContent>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {executions.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  {e.status === 'COMPLETED' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : e.status === 'FAILED' ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  )}
                  <span className="font-medium capitalize">{e.status.toLowerCase()}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(e.startedAt).toLocaleString()}
                  {e.completedAt && (
                    <> → {new Date(e.completedAt).toLocaleString()}</>
                  )}
                </div>
                {e.error && (
                  <div className="text-sm text-red-600 flex-1">{e.error}</div>
                )}
                {e.result && e.result.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1 sm:mt-0">
                    {e.result.filter((r) => r.success).length}/{e.result.length} steps ok
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
