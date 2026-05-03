'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
// ModuleTopBar is now in layout.tsx
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'
import { RefreshCw, Plus, Clock, Calendar, Search, X } from 'lucide-react'
import { format } from 'date-fns'
import { apiRequest } from '@/lib/api/client'

export default function ProjectsTimeTrackingPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [userFilter, setUserFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Fetch projects for filter
  const { data: projectsData } = useQuery({
    queryKey: ['projects', tenantId],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects?limit=1000`, {
        method: 'GET',
      })
      if (!response.ok) throw new Error('Failed to fetch projects')
      return response.json()
    },
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['projects-time-entries', tenantId, userFilter, projectFilter, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (userFilter !== 'all') {
        params.append('userId', userFilter)
      }
      if (projectFilter !== 'all') {
        params.append('projectId', projectFilter)
      }
      if (startDate) {
        params.append('startDate', startDate)
      }
      if (endDate) {
        params.append('endDate', endDate)
      }
      const response = await apiRequest(`/api/projects/time-entries?${params.toString()}`, {
        method: 'GET',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch time entries')
      }
      return response.json()
    },
  })

  // Client-side search filtering
  const filteredEntries = useMemo(() => {
    if (!data?.entries) return []
    if (!searchQuery.trim()) return data.entries
    
    const query = searchQuery.toLowerCase()
    return data.entries.filter((entry: any) =>
      entry.taskName?.toLowerCase().includes(query) ||
      entry.projectName?.toLowerCase().includes(query) ||
      entry.description?.toLowerCase().includes(query) ||
      entry.user?.name?.toLowerCase().includes(query)
    )
  }, [data?.entries, searchQuery])

  const projects = projectsData?.projects || []

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* ModuleTopBar is now in layout.tsx */}

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
            <p className="mt-2 text-gray-600">Track time spent on projects and tasks</p>
          </div>
          <Link href={`/projects/${tenantId}/Time/new`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Log Time
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by task, project, description, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <CustomSelect value={projectFilter} onValueChange={setProjectFilter} placeholder="All Projects">
                <CustomSelectTrigger className="w-48">
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">All Projects</CustomSelectItem>
                  {projects.map((project: any) => (
                    <CustomSelectItem key={project.id} value={project.id}>
                      {project.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" size="sm" onClick={() => {
                setStartDate('')
                setEndDate('')
                setProjectFilter('all')
                setUserFilter('all')
                setSearchQuery('')
              }}>
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totals?.thisWeek || 0}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totals?.thisMonth || 0}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totals?.total || 0}h</div>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries List */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <PageLoading message="Loading time entries..." fullScreen={false} />
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Failed to load time entries. Please try again.</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2 font-medium">No time entries found</p>
                <p className="text-sm text-gray-400 mb-4">
                  {searchQuery ? 'No entries match your search' : 'Start tracking time on your projects'}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')} className="mr-2">
                    Clear Search
                  </Button>
                )}
                <Link href={`/projects/${tenantId}/Projects`}>
                  <Button>View Projects</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEntries.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium">{entry.taskName || entry.task?.name || 'General Project Work'}</p>
                        <p className="text-sm text-gray-500">{entry.projectName || entry.project?.name}</p>
                        <p className="text-xs text-gray-400">{format(new Date(entry.date), 'PPp')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{entry.hours || 0}h {entry.minutes || 0}m</p>
                      {entry.billable && (
                        <p className="text-xs text-green-600">Billable</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

