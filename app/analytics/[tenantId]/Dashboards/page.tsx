'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  LayoutDashboard, Plus, Search, Edit, Trash2, 
  ArrowLeft, Eye, Settings
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CustomDashboard {
  id: string
  name: string
  config?: {
    widgets?: Array<{
      id: string
      type: string
      title: string
      position: { x: number; y: number; w: number; h: number }
    }>
  }
  createdAt: string
  updatedAt: string
}

export default function CustomDashboardsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [dashboards, setDashboards] = useState<CustomDashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [dashboardName, setDashboardName] = useState('')

  useEffect(() => {
    fetchDashboards()
  }, [tenantId])

  const fetchDashboards = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = useAuthStore.getState().token
      
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/dashboards/custom', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDashboards(data.data || [])
      } else {
        throw new Error('Failed to fetch dashboards')
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboards:', error)
      setError(error.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDashboard = async () => {
    try {
      const token = useAuthStore.getState().token
      
      const response = await fetch('/api/dashboards/custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: dashboardName,
          widgets: [],
        }),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setDashboardName('')
        fetchDashboards()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create dashboard')
      }
    } catch (error: any) {
      console.error('Failed to create dashboard:', error)
      setError(error.message || 'Failed to create dashboard')
    }
  }

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return

    try {
      const token = useAuthStore.getState().token
      
      const response = await fetch(`/api/dashboards/custom/${dashboardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchDashboards()
      } else {
        throw new Error('Failed to delete dashboard')
      }
    } catch (error: any) {
      console.error('Failed to delete dashboard:', error)
      setError(error.message || 'Failed to delete dashboard')
    }
  }

  if (loading) {
    return <PageLoading message="Loading dashboards..." fullScreen={true} />
  }

  const moduleConfig = getModuleConfig('analytics') || getModuleConfig('crm')!

  const filteredDashboards = dashboards.filter(dashboard =>
    dashboard.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const widgetCount = (dashboard: CustomDashboard) => {
    return dashboard.config?.widgets?.length || 0
  }

  const heroMetrics = [
    {
      label: 'Total Dashboards',
      value: dashboards.length.toString(),
      icon: <LayoutDashboard className="w-5 h-5" />,
      color: 'purple' as const,
    },
    {
      label: 'Total Widgets',
      value: dashboards.reduce((sum, d) => sum + widgetCount(d), 0).toString(),
      icon: <Settings className="w-5 h-5" />,
      color: 'info' as const,
    },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Custom Dashboards"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Link href={`/analytics/${tenantId}/Home`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Dashboard</DialogTitle>
                <DialogDescription>
                  Create a new custom dashboard to visualize your business metrics
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Dashboard Name</Label>
                  <Input
                    id="name"
                    value={dashboardName}
                    onChange={(e) => setDashboardName(e.target.value)}
                    placeholder="e.g., Executive Dashboard"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDashboard} disabled={!dashboardName}>
                  Create Dashboard
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <GlassCard>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search dashboards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </GlassCard>

        {/* Dashboards List */}
        {filteredDashboards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDashboards.map((dashboard) => (
              <GlassCard key={dashboard.id} delay={0.1}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {widgetCount(dashboard)} widget{widgetCount(dashboard) !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDashboard(dashboard.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Created: {new Date(dashboard.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Updated: {new Date(dashboard.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <LayoutDashboard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No dashboards found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try adjusting your search query' : 'Create your first custom dashboard to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
