'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch segments from API
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
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingSegment(null)
    setFormData({ name: '', description: '', criteria: '' })
    setIsSubmitting(false)
  }

  // Create segment mutation
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

  // Update segment mutation
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

  // Delete segment mutation
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
    
    if (!formData.name.trim() || !formData.criteria.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      if (editingSegment) {
        await updateMutation.mutateAsync({
          id: editingSegment.id,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          criteria: formData.criteria.trim(),
        })
      } else {
        await createMutation.mutateAsync({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          criteria: formData.criteria.trim(),
        })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Segments</h1>
          <p className="mt-2 text-gray-600">
            Create customer segments for targeted marketing campaigns
          </p>
        </div>
        <Button onClick={handleCreateSegment}>Create Segment</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Segments</CardTitle>
          <CardDescription>
            Use segments to target specific groups of customers in your campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">Loading segments...</div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-2">Error loading segments</p>
              <p className="text-sm text-gray-500 mb-4">
                {error instanceof Error ? error.message : 'Failed to fetch segments'}
              </p>
              <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['segments'] })}>
                Retry
              </Button>
            </div>
          ) : segments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No segments created yet</p>
              <Button onClick={handleCreateSegment}>Create your first segment</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{segment.name}</h3>
                    <span className="text-sm text-gray-500">{segment.contactCount} contacts</span>
                  </div>
                  {segment.description && (
                    <p className="text-sm text-gray-600 mb-3">{segment.description}</p>
                  )}
                  <div className="text-xs text-gray-500 mb-3">
                    <strong>Criteria:</strong> {segment.criteria}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditSegment(segment)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(segment)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                    <Link href={`/dashboard/marketing/campaigns/new?segmentId=${segment.id}`}>
                      <Button size="sm">Use in Campaign</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Segments Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Segments automatically update based on your criteria</p>
            <p>• Use segments to target specific customer groups in campaigns</p>
            <p>• Create segments based on order value, last contact date, deal stage, etc.</p>
            <p>• Segments can be combined with manual contact selection</p>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Segment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingSegment ? 'Edit Segment' : 'Create New Segment'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Segment Name *</label>
                  <Input 
                    placeholder="e.g., VIP Customers" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input 
                    placeholder="Describe this segment" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Criteria *</label>
                  <Input 
                    placeholder="e.g., Total orders > ₹50,000" 
                    value={formData.criteria}
                    onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Examples: &quot;Total orders &gt; ₹50,000&quot;, &quot;Last contacted &lt; 30 days&quot;, &quot;Deal stage = proposal OR negotiation&quot;
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting || !formData.name.trim() || !formData.criteria.trim()}
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
