'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { MapPin, Users, TrendingUp } from 'lucide-react'

interface Territory {
  id: string
  name: string
  criteria: {
    states?: string[]
    cities?: string[]
    postalCodes?: string[]
    industries?: string[]
  }
  assignedReps: Array<{
    id: string
    name: string
    email: string
  }>
  quota?: {
    target: number
    actual: number
  }
}

interface TerritoryMapProps {
  tenantId: string
}

export function TerritoryMap({ tenantId }: TerritoryMapProps) {
  const [territories, setTerritories] = useState<Territory[]>([])
  const [selectedState, setSelectedState] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTerritories()
  }, [tenantId])

  const fetchTerritories = async () => {
    try {
      const response = await fetch(`/api/territories?tenantId=${tenantId}`)
      if (!response.ok) throw new Error('Failed to fetch territories')
      const data = await response.json()
      setTerritories(data.data || [])
    } catch (error) {
      console.error('Error fetching territories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Indian states for visualization
  const indianStates = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
  ]

  const filteredTerritories =
    selectedState === 'all'
      ? territories
      : territories.filter((t) => t.criteria.states?.includes(selectedState))

  const getStateTerritories = (state: string) => {
    return territories.filter((t) => t.criteria.states?.includes(state))
  }

  const getStateColor = (state: string) => {
    const stateTerritories = getStateTerritories(state)
    if (stateTerritories.length === 0) return 'fill-gray-200 dark:fill-gray-800'
    if (stateTerritories.length === 1) return 'fill-blue-300 dark:fill-blue-700'
    return 'fill-green-300 dark:fill-green-700'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading territories...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Territory Map</CardTitle>
              <CardDescription>Geographic territory visualization</CardDescription>
            </div>
            <CustomSelect value={selectedState} onValueChange={(value: string) => setSelectedState(value)} placeholder="Filter by state">
              <CustomSelectTrigger className="w-48">
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="all">All States</CustomSelectItem>
                {indianStates.map((state) => (
                  <CustomSelectItem key={state} value={state}>
                    {state}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          </div>
        </CardHeader>
        <CardContent>
          {/* Simplified India map visualization */}
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
            {indianStates.map((state) => {
              const stateTerritories = getStateTerritories(state)
              const isSelected = selectedState === state || selectedState === 'all'
              const color = getStateColor(state)

              return (
                <div
                  key={state}
                  className={cn(
                    'p-3 rounded-lg border-2 cursor-pointer transition-all',
                    color,
                    isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200',
                    stateTerritories.length > 0 ? 'hover:shadow-md' : 'opacity-50'
                  )}
                  onClick={() => setSelectedState(state)}
                >
                  <div className="text-xs font-medium truncate">{state}</div>
                  {stateTerritories.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      {stateTerritories.length} {stateTerritories.length === 1 ? 'territory' : 'territories'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Territory List */}
      <Card>
        <CardHeader>
          <CardTitle>Territories</CardTitle>
          <CardDescription>
            {filteredTerritories.length} {filteredTerritories.length === 1 ? 'territory' : 'territories'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTerritories.map((territory) => (
              <div
                key={territory.id}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <h3 className="font-semibold">{territory.name}</h3>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {territory.criteria.states && territory.criteria.states.length > 0 && (
                        <div>
                          <span className="font-medium">States:</span>{' '}
                          {territory.criteria.states.join(', ')}
                        </div>
                      )}
                      {territory.criteria.cities && territory.criteria.cities.length > 0 && (
                        <div>
                          <span className="font-medium">Cities:</span>{' '}
                          {territory.criteria.cities.join(', ')}
                        </div>
                      )}
                      {territory.criteria.industries && territory.criteria.industries.length > 0 && (
                        <div>
                          <span className="font-medium">Industries:</span>{' '}
                          {territory.criteria.industries.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{territory.assignedReps.length} rep(s)</span>
                      </div>
                      {territory.quota && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>
                            ₹{territory.quota.actual.toLocaleString('en-IN')} / ₹
                            {territory.quota.target.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
