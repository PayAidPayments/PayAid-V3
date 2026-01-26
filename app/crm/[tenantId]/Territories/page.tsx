/**
 * Territories Management Page
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users, MapPin } from 'lucide-react'

export default function TerritoriesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [territories, setTerritories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTerritories()
  }, [tenantId])

  const fetchTerritories = async () => {
    try {
      const response = await fetch('/api/territories')
      const data = await response.json()
      if (data.success) {
        setTerritories(data.data)
      }
    } catch (error) {
      console.error('Error fetching territories:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Territories</h1>
          <p className="text-muted-foreground mt-2">
            Manage sales territories and assignments
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Territory
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : territories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No territories yet</h3>
            <Button>Create Territory</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {territories.map((territory) => (
            <Card key={territory.id}>
              <CardHeader>
                <CardTitle>{territory.name}</CardTitle>
                <CardDescription>{territory.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {territory.assignedReps?.length || 0} sales reps
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
