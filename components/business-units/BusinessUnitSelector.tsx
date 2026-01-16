'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, ChevronDown } from 'lucide-react'

interface BusinessUnit {
  id: string
  name: string
  location?: string
  industryPacks: string[]
  isActive: boolean
}

interface BusinessUnitSelectorProps {
  currentUnitId?: string
  onUnitChange: (unitId: string | null) => void
}

export function BusinessUnitSelector({ currentUnitId, onUnitChange }: BusinessUnitSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { data } = useQuery<{ units: BusinessUnit[] }>({
    queryKey: ['business-units'],
    queryFn: async () => {
      const response = await fetch('/api/business-units')
      if (!response.ok) throw new Error('Failed to fetch business units')
      return response.json()
    },
  })

  const units = data?.units || []
  const currentUnit = units.find((u) => u.id === currentUnitId)

  // If only one unit or no units, don't show selector
  if (units.length <= 1) {
    return null
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Building2 className="h-4 w-4" />
        {currentUnit ? currentUnit.name : 'Select Business Unit'}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute top-full left-0 mt-2 z-20 min-w-[200px]">
            <CardContent className="p-2">
              <div className="space-y-1">
                <Button
                  variant={!currentUnitId ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    onUnitChange(null)
                    setIsOpen(false)
                  }}
                >
                  All Business Units
                </Button>
                {units.map((unit) => (
                  <Button
                    key={unit.id}
                    variant={currentUnitId === unit.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => {
                      onUnitChange(unit.id)
                      setIsOpen(false)
                    }}
                  >
                    {unit.name}
                    {unit.location && (
                      <span className="text-xs text-gray-500 ml-2">({unit.location})</span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

