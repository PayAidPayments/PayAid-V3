'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Play, Pause, Trash2, Edit, Copy, Filter } from 'lucide-react'
import { format } from 'date-fns'

function WorkflowsPageContent() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['workflows', filterActive],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterActive !== null) params.set('isActive', filterActive)
      const response = await fetch(`/api/workflows?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch workflows')
      return response.json()
    },
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive }),
      })
      if (!response.ok) throw new Error('Failed to update workflow')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to delete workflow')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
    },
  })

  const workflows = data?.workflows || []
  const filteredWorkflows = workflows.filter((w: any) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automate your business processes with visual workflows
          </p>
        </div>
        <Link href="/dashboard/workflows/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterActive === null ? 'default' : 'outline'}
            onClick={() => setFilterActive(null)}
          >
            All
          </Button>
          <Button
            variant={filterActive === 'true' ? 'default' : 'outline'}
            onClick={() => setFilterActive('true')}
          >
            Active
          </Button>
          <Button
            variant={filterActive === 'false' ? 'default' : 'outline'}
            onClick={() => setFilterActive('false')}
          >
            Inactive
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkflows.map((workflow: any) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {workflow.description || 'No description'}
                  </CardDescription>
                </div>
                <div className={`w-3 h-3 rounded-full ${workflow.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>Trigger: {workflow.triggerType}</div>
                  <div>Steps: {(workflow.steps as any[])?.length || 0}</div>
                  <div>Executions: {workflow._count?.executions || 0}</div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/workflows/${workflow.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleActive.mutate({ id: workflow.id, isActive: !workflow.isActive })
                    }
                  >
                    {workflow.isActive ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this workflow?')) {
                        deleteWorkflow.mutate(workflow.id)
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No workflows found</p>
            <Link href="/dashboard/workflows/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workflow
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function WorkflowsPage() {
  return <WorkflowsPageContent />
}

