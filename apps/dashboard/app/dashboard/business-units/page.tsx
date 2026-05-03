'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoading } from '@/components/ui/loading'
import { Plus, Edit, Trash2, MapPin, Building2 } from 'lucide-react'
import { getAllIndustries } from '@/lib/industries/config'

interface BusinessUnit {
  id: string
  name: string
  location?: string
  industryPacks: string[]
  isActive: boolean
  createdAt: string
}

export default function BusinessUnitsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    industryPacks: [] as string[],
  })

  const { data, isLoading, refetch } = useQuery<{ units: BusinessUnit[] }>({
    queryKey: ['business-units'],
    queryFn: async () => {
      const response = await fetch('/api/business-units')
      if (!response.ok) throw new Error('Failed to fetch business units')
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/business-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create business unit')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
      setShowCreateModal(false)
      setFormData({ name: '', location: '', industryPacks: [] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/business-units/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete business unit')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
    },
  })

  const units = data?.units || []
  const industries = getAllIndustries()
  const [editingUnit, setEditingUnit] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<{
    name: string
    location: string
    industryPacks: string[]
  } | null>(null)

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editFormData }) => {
      const response = await fetch(`/api/business-units/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update business unit')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
      setEditingUnit(null)
      setEditFormData(null)
    },
  })

  const toggleIndustryPack = (packId: string) => {
    setFormData((prev) => ({
      ...prev,
      industryPacks: prev.industryPacks.includes(packId)
        ? prev.industryPacks.filter((id) => id !== packId)
        : [...prev.industryPacks, packId],
    }))
  }

  const toggleEditIndustryPack = (packId: string) => {
    if (!editFormData) return
    setEditFormData((prev) => ({
      ...prev!,
      industryPacks: prev!.industryPacks.includes(packId)
        ? prev!.industryPacks.filter((id) => id !== packId)
        : [...prev!.industryPacks, packId],
    }))
  }

  const handleEdit = (unit: BusinessUnit) => {
    setEditingUnit(unit.id)
    setEditFormData({
      name: unit.name,
      location: unit.location || '',
      industryPacks: Array.isArray(unit.industryPacks) ? unit.industryPacks : [],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Units</h1>
          <p className="mt-2 text-gray-600">Manage multiple business lines or locations</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Business Unit
        </Button>
      </div>

      {isLoading ? (
        <PageLoading message="Loading business units..." fullScreen={false} />
      ) : units.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No business units created yet</p>
            <Button onClick={() => setShowCreateModal(true)}>Create Your First Business Unit</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit) => (
            <Card key={unit.id} className={unit.isActive ? '' : 'opacity-60'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {unit.name}
                  </CardTitle>
                  {!unit.isActive && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      Inactive
                    </span>
                  )}
                </div>
                {unit.location && (
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {unit.location}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Industry Packs</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(unit.industryPacks) && unit.industryPacks.length > 0 ? (
                        unit.industryPacks.map((pack) => (
                          <span
                            key={pack}
                            className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                          >
                            {pack}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No industry packs</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(unit)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this business unit?')) {
                          deleteMutation.mutate(unit.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Business Unit</CardTitle>
              <CardDescription>Add a new business line or location</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  createMutation.mutate(formData)
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Unit Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Store, Online Division"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Mumbai, India"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry Packs</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                    {industries.map((industry) => (
                      <label
                        key={industry.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.industryPacks.includes(industry.id)}
                          onChange={() => toggleIndustryPack(industry.id)}
                          className="rounded"
                        />
                        <span>{industry.icon}</span>
                        <span className="text-sm">{industry.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Unit'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingUnit && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Business Unit</CardTitle>
              <CardDescription>Update business unit details</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  updateMutation.mutate({ id: editingUnit, data: editFormData })
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Unit Name *</label>
                  <Input
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="e.g., Main Store, Online Division"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    placeholder="e.g., Mumbai, India"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry Packs</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                    {industries.map((industry) => (
                      <label
                        key={industry.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={editFormData.industryPacks.includes(industry.id)}
                          onChange={() => toggleEditIndustryPack(industry.id)}
                          className="rounded"
                        />
                        <span>{industry.icon}</span>
                        <span className="text-sm">{industry.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingUnit(null)
                      setEditFormData(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Updating...' : 'Update Unit'}
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

