'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { WorkflowBuilderForm } from '@/components/workflow/WorkflowBuilderForm'
import { PageLoading } from '@/components/ui/loading'

export default function EditWorkflowPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const res = await fetch(`/api/workflows/${id}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to load workflow')
      const json = await res.json()
      return json.workflow
    },
    enabled: !!id,
  })

  if (isLoading || !data) {
    return <PageLoading message="Loading workflow…" />
  }
  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error instanceof Error ? error.message : 'Failed to load workflow'}
        <button className="ml-2 underline" onClick={() => router.push('/dashboard/workflows')}>
          Back to workflows
        </button>
      </div>
    )
  }

  return (
    <WorkflowBuilderForm
      workflowId={id}
      initial={data}
      onSaved={() => router.push('/dashboard/workflows')}
      onCancel={() => router.push('/dashboard/workflows')}
    />
  )
}
