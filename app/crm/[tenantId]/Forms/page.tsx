/**
 * Forms Management Page
 * Lists all forms and allows creation/editing
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, ExternalLink, BarChart3, FileText } from 'lucide-react'
import { FormBuilder } from '@/components/forms/FormBuilder'
import Link from 'next/link'

interface Form {
  id: string
  name: string
  description?: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  _count?: {
    submissions: number
  }
}

export default function FormsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingForm, setEditingForm] = useState<string | null>(null)

  useEffect(() => {
    fetchForms()
  }, [tenantId])

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms')
      const data = await response.json()
      if (data.success) {
        setForms(data.data)
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    setShowBuilder(false)
    setEditingForm(null)
    fetchForms()
  }

  if (showBuilder || editingForm) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => {
            setShowBuilder(false)
            setEditingForm(null)
          }}>
            ← Back to Forms
          </Button>
        </div>
        <FormBuilder
          tenantId={tenantId}
          formId={editingForm || undefined}
          onSave={handleSave}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Forms</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage web forms to capture leads
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading forms...</div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first form to start capturing leads
            </p>
            <Button onClick={() => setShowBuilder(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{form.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {form.description || 'No description'}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    form.status === 'published' ? 'bg-green-100 text-green-800' :
                    form.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {form.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Submissions</span>
                    <span className="font-semibold">{form._count?.submissions || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingForm(form.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/crm/${tenantId}/Forms/${form.id}/analytics`}>
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analytics
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`/api/forms/${form.slug}/render?tenantId=${tenantId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
