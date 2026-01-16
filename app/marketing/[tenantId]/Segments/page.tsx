'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SegmentBuilder, type SegmentCriteria } from '@/components/segments/SegmentBuilder'
import { criteriaToString, criteriaToConfig, configToCriteria } from '@/lib/segments/criteria-converter'
import { PageLoading } from '@/components/ui/loading'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

interface Segment {
  id: string
  name: string
  description?: string
  criteria: string
  contactCount: number
  createdAt: string
  updatedAt?: string
}

export default function SegmentsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: '',
  })
  const [visualCriteria, setVisualCriteria] = useState<SegmentCriteria[]>([
    { field: '', operator: '', value: '' },
  ])
  const [useVisualBuilder, setUseVisualBuilder] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const response = await fetch('/api/marketing/segments', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error('Failed to fetch segments')
      return response.json()
    },
  })

  const segments: Segment[] = data?.segments || []

  const handleCreateSegment = () => {
    setFormData({ name: '', description: '', criteria: '' })
    setVisualCriteria([{ field: '', operator: '', value: '' }])
    setUseVisualBuilder(true)
    setEditingSegment(null)
    setShowCreateModal(true)
  }

  const handleEditSegment = (segment: Segment) => {
    setEditingSegment(segment)
    setFormData({
      name: segment.name,
      description: segment.description || '',
      criteria: segment.criteria,
    })
    try {
      const config = JSON.parse(segment.criteria || '{}')
      if (Array.isArray(config)) {
        setVisualCriteria(config)
        setUseVisualBuilder(true)
      } else {
        setUseVisualBuilder(false)
      }
    } catch {
      setUseVisualBuilder(false)
    }
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingSegment(null)
    setFormData({ name: '', description: '', criteria: '' })
    setIsSubmitting(false)
  }

  const createMutation = useMutation({
    mutationFn: async (segmentData: { name: string; description?: string; criteria: string }) => {
      const response = await fetch('/api/marketing/segments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(segmentData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create segment')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] })
      handleCloseModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...segmentData }: { id: string; name?: string; description?: string; criteria?: string }) => {
      const response = await fetch(`/api/marketing/segments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(segmentData),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update segment')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] })
      handleCloseModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/marketing/segments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete segment')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Please enter a segment name')
      return
    }

    if (useVisualBuilder) {
      const hasValidCriteria = visualCriteria.some(
        (c) => c.field && c.operator && (c.value || c.operator === 'isEmpty' || c.operator === 'isNotEmpty')
      )
      if (!hasValidCriteria) {
        alert('Please add at least one valid criteria condition')
        return
      }
    } else if (!formData.criteria.trim()) {
      alert('Please enter criteria')
      return
    }

    setIsSubmitting(true)

    try {
      const criteriaString = useVisualBuilder
        ? criteriaToString(visualCriteria)
        : formData.criteria.trim()
      const criteriaConfig = useVisualBuilder
        ? criteriaToConfig(visualCriteria)
        : undefined

      if (editingSegment) {
        await updateMutation.mutateAsync({
          id: editingSegment.id,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          criteria: criteriaString,
          criteriaConfig: criteriaConfig,
        } as any)
      } else {
        await createMutation.mutateAsync({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          criteria: criteriaString,
          criteriaConfig: criteriaConfig,
        } as any)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save segment')
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (segment: Segment) => {
    if (!confirm(`Are you sure you want to delete "${segment.name}"?`)) {
      return
    }

    try {
      await deleteMutation.mutateAsync(segment.id)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete segment')
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading segments..." fullScreen={false} />
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Campaign Segments</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create customer segments for targeted marketing campaigns
          </p>
        </div>
        <Button onClick={handleCreateSegment} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Segment</Button>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Your Segments</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Use segments to target specific groups of customers in your campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-2">Error loading segments</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {error instanceof Error ? error.message : 'Failed to fetch segments'}
              </p>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['segments'] })} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Retry
              </Button>
            </div>
          ) : segments.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No segments created yet</p>
              <Button onClick={handleCreateSegment} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create your first segment</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow dark:bg-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{segment.name}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{segment.contactCount} contacts</span>
                  </div>
                  {segment.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{segment.description}</p>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <strong>Criteria:</strong> {segment.criteria}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditSegment(segment)}
                      className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(segment)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 dark:border-gray-600"
                    >
                      Delete
                    </Button>
                    <Link href={`/marketing/${tenantId}/Campaigns/New?segmentId=${segment.id}`}>
                      <Button size="sm" className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Use in Campaign</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">How Segments Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>• Segments automatically update based on your criteria</p>
            <p>• Use segments to target specific customer groups in campaigns</p>
            <p>• Create segments based on order value, last contact date, deal stage, etc.</p>
            <p>• Segments can be combined with manual contact selection</p>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Segment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">
                {editingSegment ? 'Edit Segment' : 'Create New Segment'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Segment Name *</label>
                    <Input 
                      placeholder="e.g., VIP Customers" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <Input 
                      placeholder="Describe this segment" 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Criteria *</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={useVisualBuilder ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUseVisualBuilder(true)}
                        className={useVisualBuilder ? 'dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600' : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}
                      >
                        Visual Builder
                      </Button>
                      <Button
                        type="button"
                        variant={!useVisualBuilder ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setUseVisualBuilder(false)}
                        className={!useVisualBuilder ? 'dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600' : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}
                      >
                        Text Mode
                      </Button>
                    </div>
                  </div>

                  {useVisualBuilder ? (
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                      <SegmentBuilder
                        criteria={visualCriteria}
                        onCriteriaChange={setVisualCriteria}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input 
                        placeholder="e.g., Total orders > ₹50,000" 
                        value={formData.criteria}
                        onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                        required={!useVisualBuilder}
                        className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Examples: &quot;Total orders &gt; ₹50,000&quot;, &quot;Last contacted &lt; 30 days&quot;, &quot;Deal stage = proposal OR negotiation&quot;
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t dark:border-gray-700">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting || !formData.name.trim()}
                    className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  >
                    {isSubmitting ? 'Saving...' : editingSegment ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
