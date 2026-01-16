'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { Check, Sparkles, Package } from 'lucide-react'

interface Module {
  id: string
  name: string
  description: string
  icon: string
  category: 'base' | 'industry' | 'recommended'
  isActive: boolean
  isRecommended?: boolean
}

export default function ModulesPage() {
  const [viewMode, setViewMode] = useState<'recommended' | 'all'>('recommended')

  const { data, isLoading, refetch } = useQuery<{
    recommended: Module[]
    all: Module[]
    base: Module[]
    industry: Module[]
  }>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await fetch('/api/modules')
      if (!response.ok) throw new Error('Failed to fetch modules')
      return response.json()
    },
  })

  const toggleModuleMutation = useMutation({
    mutationFn: async ({ moduleId, isActive }: { moduleId: string; isActive: boolean }) => {
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to toggle module')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
    },
  })

  if (isLoading) {
    return <PageLoading message="Loading modules..." fullScreen={false} />
  }

  const recommended = data?.recommended || []
  const allModules = data?.all || []
  const baseModules = data?.base || []
  const industryModules = data?.industry || []

  const displayModules = viewMode === 'recommended' ? recommended : allModules

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Modules</h1>
          <p className="mt-2 text-gray-600">Manage your business modules and industry packs</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'recommended' ? 'default' : 'outline'}
            onClick={() => setViewMode('recommended')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Recommended for you
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            onClick={() => setViewMode('all')}
          >
            <Package className="h-4 w-4 mr-2" />
            All modules
          </Button>
        </div>
      </div>

      {/* Recommended Section */}
      {viewMode === 'recommended' && recommended.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Recommended for you</h2>
            <p className="text-sm text-gray-600">
              Based on your business type and goals, we recommend these modules
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onToggle={(isActive) =>
                  toggleModuleMutation.mutate({ moduleId: module.id, isActive })
                }
                isToggling={toggleModuleMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Modules Section */}
      {viewMode === 'all' && (
        <div className="space-y-6">
          {/* Base Modules */}
          {baseModules.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Base Modules</h2>
              <p className="text-sm text-gray-600 mb-4">
                Core modules included with every plan
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {baseModules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onToggle={(isActive) =>
                      toggleModuleMutation.mutate({ moduleId: module.id, isActive })
                    }
                    isToggling={toggleModuleMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Industry Packs */}
          {industryModules.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Industry Packs</h2>
              <p className="text-sm text-gray-600 mb-4">
                Specialized modules for specific industries
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {industryModules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onToggle={(isActive) =>
                      toggleModuleMutation.mutate({ moduleId: module.id, isActive })
                    }
                    isToggling={toggleModuleMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {displayModules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No modules available</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ModuleCard({
  module,
  onToggle,
  isToggling,
}: {
  module: Module
  onToggle: (isActive: boolean) => void
  isToggling: boolean
}) {
  return (
    <Card className={`transition-all ${module.isActive ? 'border-purple-500' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{module.icon}</span>
            <div>
              <CardTitle className="text-lg">{module.name}</CardTitle>
              {module.isRecommended && (
                <Badge variant="secondary" className="mt-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              )}
            </div>
          </div>
          {module.category !== 'base' && (
            <Button
              variant={module.isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onToggle(!module.isActive)}
              disabled={isToggling}
            >
              {module.isActive ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Active
                </>
              ) : (
                'Enable'
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{module.description}</CardDescription>
        {module.category === 'base' && (
          <Badge variant="outline" className="mt-2">
            Always included
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

