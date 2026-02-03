'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  FileText, 
  Video, 
  Presentation, 
  MessageSquare,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Star,
  TrendingUp,
  ExternalLink
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'

interface EnablementResource {
  id: string
  title: string
  type: 'playbook' | 'template' | 'script' | 'video' | 'presentation'
  category: string
  description: string
  content?: string
  url?: string
  tags: string[]
  usageCount: number
  rating: number
  createdAt: string
  updatedAt: string
}

export default function SalesEnablementPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState<EnablementResource[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [selectedResource, setSelectedResource] = useState<EnablementResource | null>(null)

  useEffect(() => {
    fetchResources()
  }, [tenantId, token])

  const fetchResources = async () => {
    try {
      setLoading(true)
      if (!token) return

      const response = await fetch('/api/crm/sales-enablement/resources', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setResources(data.resources || [])
      } else {
        setResources([])
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'playbook':
        return BookOpen
      case 'template':
        return FileText
      case 'script':
        return MessageSquare
      case 'video':
        return Video
      case 'presentation':
        return Presentation
      default:
        return FileText
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'playbook':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'template':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'script':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'video':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'presentation':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = filterType === 'all' || resource.type === filterType
    
    return matchesSearch && matchesType
  })

  if (loading) {
    return <PageLoading message="Loading sales enablement library..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sales Enablement Library</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Playbooks, templates, scripts, and resources for your sales team
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Resources</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {resources.length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Playbooks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {resources.filter(r => r.type === 'playbook').length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Templates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {resources.filter(r => r.type === 'template').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {resources.reduce((sum, r) => sum + r.usageCount, 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="all">All Types</option>
              <option value="playbook">Playbooks</option>
              <option value="template">Templates</option>
              <option value="script">Scripts</option>
              <option value="video">Videos</option>
              <option value="presentation">Presentations</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const Icon = getTypeIcon(resource.type)
            return (
              <Card 
                key={resource.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => {
                  // Show resource detail in modal
                  setSelectedResource(resource)
                  setShowResourceModal(true)
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded ${getTypeColor(resource.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge className={getTypeColor(resource.type)}>
                        {resource.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{resource.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Category</p>
                    <Badge variant="outline">{resource.category}</Badge>
                  </div>
                  {resource.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {resource.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{resource.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>{resource.usageCount} uses</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || filterType !== 'all'
                ? 'No resources match your filters.'
                : 'No resources added yet. Create your first sales enablement resource.'}
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Resource Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Sales Enablement Resource</CardTitle>
              <CardDescription>Create playbooks, templates, scripts, and more</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <Input placeholder="e.g., Enterprise Sales Playbook" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg">
                  <option value="playbook">Playbook</option>
                  <option value="template">Template</option>
                  <option value="script">Script</option>
                  <option value="video">Video</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Describe this resource..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Create Resource
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
