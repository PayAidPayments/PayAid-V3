'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AgricultureCrop {
  id: string
  cropName: string
  cropType?: string
  season?: string
  area?: number
  sowingDate?: string
  expectedHarvestDate?: string
  status: string
  harvests: any[]
}

export default function AgricultureCropsPage() {
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [season, setSeason] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    cropName: '',
    cropType: '',
    season: '',
    area: '',
    sowingDate: '',
    expectedHarvestDate: '',
    notes: '',
  })

  const { data, isLoading } = useQuery<{ crops: AgricultureCrop[] }>({
    queryKey: ['agriculture-crops', selectedStatus, season],
    queryFn: async () => {
      let url = '/api/industries/agriculture/crops'
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (season !== 'all') params.append('season', season)
      if (params.toString()) url += '?' + params.toString()
      
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch crops')
      return response.json()
    },
  })

  const createCropMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('/api/industries/agriculture/crops', {
        method: 'POST',
        body: JSON.stringify({
          cropName: data.cropName,
          cropType: data.cropType || undefined,
          season: data.season || undefined,
          area: data.area ? parseFloat(data.area) : undefined,
          sowingDate: data.sowingDate || undefined,
          expectedHarvestDate: data.expectedHarvestDate || undefined,
          notes: data.notes || undefined,
        }),
      })
      if (!response.ok) throw new Error('Failed to create crop')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agriculture-crops'] })
      setShowAddForm(false)
      setFormData({
        cropName: '',
        cropType: '',
        season: '',
        area: '',
        sowingDate: '',
        expectedHarvestDate: '',
        notes: '',
      })
    },
  })

  const crops = data?.crops || []

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNED: 'bg-blue-100 text-blue-800',
      SOWN: 'bg-yellow-100 text-yellow-800',
      GROWING: 'bg-green-100 text-green-800',
      HARVESTED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crops</h1>
          <p className="mt-2 text-gray-600">Manage crop planning and tracking</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add New Crop'}
        </Button>
      </div>

      {/* Add Crop Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Crop</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createCropMutation.mutate(formData)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Crop Name *</label>
                  <Input
                    value={formData.cropName}
                    onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Crop Type</label>
                  <select
                    value={formData.cropType}
                    onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Type</option>
                    <option value="CEREAL">Cereal</option>
                    <option value="PULSE">Pulse</option>
                    <option value="VEGETABLE">Vegetable</option>
                    <option value="FRUIT">Fruit</option>
                    <option value="SPICE">Spice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Season</label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Season</option>
                    <option value="KHARIF">Kharif</option>
                    <option value="RABI">Rabi</option>
                    <option value="SUMMER">Summer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Area (acres)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sowing Date</label>
                  <Input
                    type="date"
                    value={formData.sowingDate}
                    onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Harvest Date</label>
                  <Input
                    type="date"
                    value={formData.expectedHarvestDate}
                    onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={createCropMutation.isPending}>
                {createCropMutation.isPending ? 'Creating...' : 'Create Crop'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="PLANNED">Planned</option>
            <option value="SOWN">Sown</option>
            <option value="GROWING">Growing</option>
            <option value="HARVESTED">Harvested</option>
          </select>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Seasons</option>
            <option value="KHARIF">Kharif</option>
            <option value="RABI">Rabi</option>
            <option value="SUMMER">Summer</option>
          </select>
        </CardContent>
      </Card>

      {/* Crops List */}
      {isLoading ? (
        <div className="text-center py-8">Loading crops...</div>
      ) : crops.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No crops found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {crops.map((crop) => (
            <Card key={crop.id}>
              <CardHeader>
                <CardTitle>{crop.cropName}</CardTitle>
                <CardDescription>
                  {crop.cropType && `${crop.cropType} | `}
                  {crop.season && `Season: ${crop.season}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {crop.area && <p><strong>Area:</strong> {crop.area} acres</p>}
                  {crop.sowingDate && (
                    <p><strong>Sowing:</strong> {new Date(crop.sowingDate).toLocaleDateString()}</p>
                  )}
                  {crop.expectedHarvestDate && (
                    <p><strong>Expected Harvest:</strong> {new Date(crop.expectedHarvestDate).toLocaleDateString()}</p>
                  )}
                  <p><strong>Harvests:</strong> {crop.harvests.length}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(crop.status)}`}>
                    {crop.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

