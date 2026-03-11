'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EmailTemplate {
  id: string
  name: string
  category?: string
  subject: string
  timesUsed: number
  isDefault: boolean
  isActive: boolean
  createdAt: string
}

export default function EmailTemplatesPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  const { data, isLoading } = useQuery<{ templates: EmailTemplate[] }>({
    queryKey: ['email-templates', categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (categoryFilter) params.append('category', categoryFilter)
      params.append('isActive', 'true')

      const response = await fetch(`/api/email-templates?${params}`)
      if (!response.ok) throw new Error('Failed to fetch email templates')
      return response.json()
    },
  })

  const templates = data?.templates || []
  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Template Library</h1>
          <p className="mt-2 text-gray-600">Manage reusable email templates</p>
        </div>
        <Link href="/dashboard/email-templates/new">
          <Button>Create Template</Button>
        </Link>
      </div>

      {/* Filters */}
      {categories.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Category:</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 rounded-md border border-gray-300 px-3"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No email templates found</p>
              <Link href="/dashboard/email-templates/new">
                <Button>Create Your First Template</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{template.name}</CardTitle>
                  {template.isDefault && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Default
                    </span>
                  )}
                </div>
                {template.category && (
                  <CardDescription>{template.category}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Subject: </span>
                    <span className="font-medium">{template.subject}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Times Used:</span>
                    <span className="font-semibold">{template.timesUsed}</span>
                  </div>
                </div>
                <Link href={`/dashboard/email-templates/${template.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View & Edit
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
