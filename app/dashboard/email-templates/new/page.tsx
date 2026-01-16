'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmailTemplateEditor } from '@/components/email-templates/EmailTemplateEditor'
import { PREBUILT_TEMPLATES, type PrebuiltTemplate } from '@/lib/email-templates/prebuilt-templates'

export default function NewEmailTemplatePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    variables: [] as string[],
    isDefault: false,
  })
  const [error, setError] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          category: data.category || undefined,
          textContent: data.textContent || undefined,
          variables: data.variables.length > 0 ? data.variables : undefined,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create email template')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/dashboard/email-templates/${data.id}`)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    createMutation.mutate(formData)
  }

  const loadTemplate = (template: PrebuiltTemplate) => {
    setFormData({
      name: template.name,
      category: template.category,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      variables: template.variables,
      isDefault: false,
    })
    setShowTemplates(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Email Template</h1>
          <p className="mt-2 text-gray-600">Create a reusable email template</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplates(!showTemplates)}>
            {showTemplates ? 'Hide' : 'Browse'} Templates
          </Button>
          <Link href="/dashboard/email-templates">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>

      {/* Pre-built Templates */}
      {showTemplates && (
        <Card>
          <CardHeader>
            <CardTitle>Pre-built Templates</CardTitle>
            <CardDescription>Start with a professional template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PREBUILT_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 cursor-pointer transition-colors"
                  onClick={() => loadTemplate(template)}
                >
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {template.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {template.variables.length} variables
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>Enter your email template information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

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
                  placeholder="e.g., Welcome Email"
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
                  placeholder="e.g., welcome, invoice, marketing"
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

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="subject" className="text-sm font-medium text-gray-700">
                  Subject <span className="text-red-500">*</span>
                </label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="e.g., Welcome to {{company}}!"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="subject" className="text-sm font-medium text-gray-700">
                  Subject <span className="text-red-500">*</span>
                </label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="e.g., Welcome to {{company}}!"
                />
              </div>

              {/* Enhanced Email Template Editor */}
              <div className="md:col-span-2">
                <EmailTemplateEditor
                  htmlContent={formData.htmlContent}
                  textContent={formData.textContent}
                  subject={formData.subject}
                  variables={formData.variables}
                  onHtmlChange={(html) => setFormData({ ...formData, htmlContent: html })}
                  onTextChange={(text) => setFormData({ ...formData, textContent: text })}
                  onSubjectChange={(subject) => setFormData({ ...formData, subject })}
                  onVariablesChange={(variables) => setFormData({ ...formData, variables })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/dashboard/email-templates">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
