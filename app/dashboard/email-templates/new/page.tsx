'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
  const [newVariable, setNewVariable] = useState('')
  const [error, setError] = useState('')

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

  const addVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable.trim()],
      })
      setNewVariable('')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Email Template</h1>
          <p className="mt-2 text-gray-600">Create a reusable email template</p>
        </div>
        <Link href="/dashboard/email-templates">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

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
                <label htmlFor="htmlContent" className="text-sm font-medium text-gray-700">
                  HTML Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="htmlContent"
                  name="htmlContent"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  required
                  rows={12}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                  placeholder="<html>...</html>"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="textContent" className="text-sm font-medium text-gray-700">
                  Plain Text Content (optional)
                </label>
                <textarea
                  id="textContent"
                  name="textContent"
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  rows={6}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Plain text version..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Available Variables</label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    placeholder="e.g., {{name}}, {{company}}"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addVariable()
                      }
                    }}
                  />
                  <Button type="button" onClick={addVariable} variant="outline">
                    Add
                  </Button>
                </div>
                {formData.variables.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.variables.map((variable, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center gap-1"
                      >
                        {variable}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              variables: formData.variables.filter((_, i) => i !== idx),
                            })
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Variables can be used in the template like {{variableName}}
                </p>
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
