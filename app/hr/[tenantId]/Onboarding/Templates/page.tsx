'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'

interface OnboardingTask {
  id: string
  title: string
  description?: string
  assignedToRole: string
  dueDaysRelative: number
  order: number
}

interface OnboardingTemplate {
  id: string
  name: string
  description?: string
  isActive: boolean
  tasks: OnboardingTask[]
  _count: {
    instances: number
  }
  createdAt: string
}

export default function OnboardingTemplatesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [isActiveFilter, setIsActiveFilter] = useState<string>('')

  const { data, isLoading, refetch } = useQuery<{
    templates: OnboardingTemplate[]
  }>({
    queryKey: ['onboarding-templates', isActiveFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (isActiveFilter !== '') params.append('isActive', isActiveFilter)

      const response = await fetch(`/api/hr/onboarding/templates?${params}`)
      if (!response.ok) throw new Error('Failed to fetch onboarding templates')
      return response.json()
    },
  })

  if (isLoading) {
    return <PageLoading message="Loading onboarding templates..." fullScreen={false} />
  }

  const templates = data?.templates || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Onboarding Templates</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Create and manage onboarding checklists</p>
        </div>
        <Link href={`/hr/${tenantId}/Onboarding/Templates/New`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Template</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
            >
              <option value="">All Templates</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
            <Button onClick={() => refetch()} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">All Templates</CardTitle>
          <CardDescription className="dark:text-gray-400">
            {templates.length} total templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No onboarding templates found</p>
              <Link href={`/hr/${tenantId}/Onboarding/Templates/New`}>
                <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Your First Template</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <Card key={template.id} className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 dark:text-gray-100">
                          {template.name}
                          {template.isActive ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                              Inactive
                            </span>
                          )}
                        </CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1 dark:text-gray-400">{template.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/hr/${tenantId}/Onboarding/Templates/${template.id}`}>
                          <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                            View/Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>{template.tasks.length}</strong> tasks •{' '}
                        <strong>{template._count.instances}</strong> instances
                      </div>
                      {template.tasks.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium mb-1 dark:text-gray-300">Tasks:</div>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {template.tasks.slice(0, 5).map((task) => (
                              <li key={task.id}>
                                {task.title} ({task.assignedToRole}, Day {task.dueDaysRelative >= 0 ? '+' : ''}
                                {task.dueDaysRelative})
                              </li>
                            ))}
                            {template.tasks.length > 5 && (
                              <li className="text-gray-400 dark:text-gray-500">
                                ... and {template.tasks.length - 5} more
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
