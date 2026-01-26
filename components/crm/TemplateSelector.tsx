'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Check, Building2, ShoppingBag, Users } from 'lucide-react'

interface Template {
  id: string
  name: string
  industry: string
  description: string
  stageCount: number
  customFieldCount: number
}

interface PreviewData {
  template: {
    id: string
    name: string
    industry: string
    stages: Array<{ id: string; name: string; probability: number }>
    customFields: Array<{ name: string; fieldType: string }>
  }
  existingDeals: number
  existingCustomFields: number
  newCustomFields: number
  stageMapping: Record<string, string>
}

export function TemplateSelector() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const { data: templatesData, isLoading } = useQuery<{ templates: Template[] }>({
    queryKey: ['industry-templates'],
    queryFn: async () => {
      const response = await apiRequest('/api/crm/templates')
      if (!response.ok) throw new Error('Failed to fetch templates')
      return response.json()
    },
  })

  const { data: previewData } = useQuery<{ preview: PreviewData }>({
    queryKey: ['template-preview', selectedTemplate],
    queryFn: async () => {
      if (!selectedTemplate) return null
      const response = await apiRequest('/api/crm/templates', {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplate,
          preview: true,
        }),
      })
      if (!response.ok) throw new Error('Failed to preview template')
      return response.json()
    },
    enabled: !!selectedTemplate && showPreview,
  })

  const applyMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await apiRequest('/api/crm/templates', {
        method: 'POST',
        body: JSON.stringify({
          templateId,
          preview: false,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to apply template')
      }
      return response.json()
    },
    onSuccess: () => {
      alert('Template applied successfully!')
      setSelectedTemplate(null)
      setShowPreview(false)
    },
  })

  const templates = templatesData?.templates || []

  const getIndustryIcon = (industry: string) => {
    switch (industry) {
      case 'fintech':
        return <Building2 className="h-5 w-5" />
      case 'd2c':
        return <ShoppingBag className="h-5 w-5" />
      case 'agencies':
        return <Users className="h-5 w-5" />
      default:
        return <Building2 className="h-5 w-5" />
    }
  }

  const getIndustryColor = (industry: string) => {
    switch (industry) {
      case 'fintech':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'd2c':
        return 'bg-purple-50 border-purple-200 text-purple-700'
      case 'agencies':
        return 'bg-green-50 border-green-200 text-green-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Industry Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Loading templates...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Industry Template</CardTitle>
          <CardDescription>
            Choose a pre-configured pipeline template optimized for your industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id
                    ? 'ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => {
                  setSelectedTemplate(template.id)
                  setShowPreview(true)
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIndustryIcon(template.industry)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Badge className={getIndustryColor(template.industry)}>
                      {template.industry.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{template.stageCount} Stages</span>
                    <span>{template.customFieldCount} Custom Fields</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {showPreview && previewData?.preview && (
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
            <CardDescription>
              Review changes before applying the template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Existing Deals</div>
                <div className="text-2xl font-bold">{previewData.preview.existingDeals}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Existing Fields</div>
                <div className="text-2xl font-bold">{previewData.preview.existingCustomFields}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">New Fields</div>
                <div className="text-2xl font-bold text-blue-600">{previewData.preview.newCustomFields}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Pipeline Stages</h4>
              <div className="space-y-2">
                {previewData.preview.template.stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <span>{stage.name}</span>
                    </div>
                    <Badge variant="outline">{stage.probability}%</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Custom Fields</h4>
              <div className="grid grid-cols-2 gap-2">
                {previewData.preview.template.customFields.map((field) => (
                  <div key={field.name} className="p-2 bg-gray-50 rounded text-sm">
                    {field.name} <span className="text-gray-500">({field.fieldType})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false)
                  setSelectedTemplate(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedTemplate) {
                    if (confirm('Are you sure you want to apply this template? This will update your pipeline stages and create custom fields.')) {
                      applyMutation.mutate(selectedTemplate)
                    }
                  }
                }}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Apply Template
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
