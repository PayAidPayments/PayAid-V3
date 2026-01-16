'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { useState } from 'react'
import { PageLoading } from '@/components/ui/loading'
import { EmailTemplateEditor } from '@/components/email-templates/EmailTemplateEditor'

interface EmailTemplate {
  id: string
  name: string
  category?: string
  subject: string
  htmlContent: string
  textContent?: string
  variables?: string[]
  timesUsed: number
  isDefault: boolean
  isActive: boolean
  lastUsedAt?: string
  createdAt: string
}

export default function EmailTemplateDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    variables: [] as string[],
    isDefault: false,
    isActive: true,
  })

  const { data: template, refetch } = useQuery<EmailTemplate>({
    queryKey: ['email-template', id],
    queryFn: async () => {
      const response = await fetch(`/api/email-templates/${id}`)
      if (!response.ok) throw new Error('Failed to fetch email template')
      const data = await response.json()
      setFormData({
        name: data.name,
        category: data.category || '',
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent || '',
        variables: (data.variables as string[]) || [],
        isDefault: data.isDefault,
        isActive: data.isActive,
      })
      return data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/email-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          category: data.category || null,
          textContent: data.textContent || null,
          variables: data.variables || [],
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update email template')
      }
      return response.json()
    },
    onSuccess: () => {
      setIsEditing(false)
      refetch()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  if (!template) {
    return <PageLoading message="Loading email template..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
          {template.category && (
            <p className="mt-2 text-gray-600">{template.category}</p>
          )}
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit
              </Button>
              <Link href="/dashboard/email-templates">
                <Button variant="outline">Back</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Email Template</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Set as Default</span>
                  </label>
                </div>
                {/* Enhanced Email Template Editor */}
                <div className="md:col-span-2">
                  <EmailTemplateEditor
                    htmlContent={formData.htmlContent}
                    textContent={formData.textContent}
                    subject={formData.subject}
                    variables={template.variables || []}
                    onHtmlChange={(html) => setFormData({ ...formData, htmlContent: html })}
                    onTextChange={(text) => setFormData({ ...formData, textContent: text })}
                    onSubjectChange={(subject) => setFormData({ ...formData, subject })}
                    onVariablesChange={(variables) => {
                      setFormData({ ...formData, variables })
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm text-gray-900">{template.category || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Times Used</dt>
                  <dd className="mt-1 text-sm text-gray-900">{template.timesUsed}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {template.isDefault && (
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </dd>
                </div>
                {template.lastUsedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Used</dt>
                    <dd className="mt-1 text-sm text-gray-900">{format(new Date(template.lastUsedAt), 'PPp')}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{format(new Date(template.createdAt), 'PPp')}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{template.subject}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HTML Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded">
                <pre className="text-xs overflow-auto whitespace-pre-wrap">
                  {template.htmlContent}
                </pre>
              </div>
            </CardContent>
          </Card>

          {template.textContent && (
            <Card>
              <CardHeader>
                <CardTitle>Plain Text Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="text-xs overflow-auto whitespace-pre-wrap">
                    {template.textContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {template.variables && template.variables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {variable}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
